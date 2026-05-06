import prisma from '../lib/prisma';

export class TreasuryService {
  /**
   * Calculates the real-time treasury (trésorerie immédiate) for a store.
   * Treasury = Sales Income + Financial Record Assets - Expenses - Financial Record Liabilities
   * All grouped by payment method for precise cash/bank/mobile tracking.
   */
  static async getTreasury(storeId: string) {
    // 1. Sales income grouped by paymentMethod
    const salesByMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { storeId },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    // 2. Expenses grouped by paymentMethod
    const expensesByMethod = await prisma.expense.groupBy({
      by: ['paymentMethod'],
      where: { storeId },
      _sum: { amount: true },
      _count: { id: true }
    });

    // 2b. Purchases grouped by paymentMethod (outflows)
    const purchasesByMethod = await prisma.purchase.groupBy({
      by: ['paymentMethod'],
      where: { storeId, isPaid: true },
      _sum: { amount: true },
      _count: { id: true }
    });

    // 3. Financial Records (ASSET entries = inflows, LIABILITY = outflows) by paymentMethod
    const financialRecords = await prisma.financialRecord.findMany({
      where: { storeId },
      select: { type: true, amount: true, paymentMethod: true }
    });

    // Build unified treasury map
    const methods = ['CASH', 'BANK', 'MOBILE', 'MOBILE_MONEY'];
    const treasuryMap: Record<string, { income: number; expenses: number; balance: number; txCount: number; capitalInject: number }> = {};

    for (const m of methods) {
      treasuryMap[m] = { income: 0, expenses: 0, balance: 0, txCount: 0, capitalInject: 0 };
    }

    const ensureMethod = (method: string) => {
      if (!treasuryMap[method]) {
        treasuryMap[method] = { income: 0, expenses: 0, balance: 0, txCount: 0, capitalInject: 0 };
      }
    };

    // Sales = income
    for (const s of salesByMethod) {
      const method = s.paymentMethod || 'CASH';
      ensureMethod(method);
      treasuryMap[method].income += s._sum.totalAmount || 0;
      treasuryMap[method].txCount += s._count.id || 0;
    }

    // Expenses = outflows
    for (const e of expensesByMethod) {
      const method = e.paymentMethod || 'CASH';
      ensureMethod(method);
      treasuryMap[method].expenses += e._sum.amount || 0;
      treasuryMap[method].txCount += e._count.id || 0;
    }

    // Purchases = outflows
    for (const p of purchasesByMethod) {
      const method = p.paymentMethod || 'CASH';
      ensureMethod(method);
      treasuryMap[method].expenses += p._sum.amount || 0;
      treasuryMap[method].txCount += p._count.id || 0;
    }

    // Financial Records: ASSET/EQUITY = capital injected (income), LIABILITY = debt (not cash out)
    for (const fr of financialRecords) {
      const method = fr.paymentMethod || 'CASH';
      ensureMethod(method);
      
      if (fr.type === 'ASSET' || fr.type === 'EQUITY') {
        // Capital/asset entries are money that entered the account
        treasuryMap[method].capitalInject += fr.amount;
        treasuryMap[method].income += fr.amount;
      }
      // LIABILITY records are obligations, not actual cash outflows
      // They don't reduce treasury unless paid (which would be an Expense)
    }

    // Calculate balance
    for (const method of Object.keys(treasuryMap)) {
      treasuryMap[method].balance = treasuryMap[method].income - treasuryMap[method].expenses;
    }

    const totalIncome = Object.values(treasuryMap).reduce((acc, v) => acc + v.income, 0);
    const totalExpenses = Object.values(treasuryMap).reduce((acc, v) => acc + v.expenses, 0);
    const totalBalance = totalIncome - totalExpenses;

    return {
      byMethod: treasuryMap,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalBalance
      }
    };
  }

  /**
   * Gets treasury for a specific date range
   */
  static async getTreasuryForPeriod(storeId: string, startDate: Date, endDate: Date) {
    // Sales in period
    const salesByMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { storeId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    // Expenses in period
    const expensesByMethod = await prisma.expense.groupBy({
      by: ['paymentMethod'],
      where: { storeId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Purchases in period
    const purchasesByMethod = await prisma.purchase.groupBy({
      by: ['paymentMethod'],
      where: { storeId, isPaid: true, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Financial Records in period
    const financialRecords = await prisma.financialRecord.findMany({
      where: { storeId, date: { gte: startDate, lte: endDate } },
      select: { type: true, amount: true, paymentMethod: true }
    });

    const methods = ['CASH', 'BANK', 'MOBILE', 'MOBILE_MONEY'];
    const treasuryMap: Record<string, { income: number; expenses: number; balance: number; txCount: number; capitalInject: number }> = {};

    for (const m of methods) {
      treasuryMap[m] = { income: 0, expenses: 0, balance: 0, txCount: 0, capitalInject: 0 };
    }

    const ensureMethod = (method: string) => {
      if (!treasuryMap[method]) {
        treasuryMap[method] = { income: 0, expenses: 0, balance: 0, txCount: 0, capitalInject: 0 };
      }
    };

    for (const s of salesByMethod) {
      const method = s.paymentMethod || 'CASH';
      ensureMethod(method);
      treasuryMap[method].income += s._sum.totalAmount || 0;
      treasuryMap[method].txCount += s._count.id || 0;
    }

    for (const e of expensesByMethod) {
      const method = e.paymentMethod || 'CASH';
      ensureMethod(method);
      treasuryMap[method].expenses += e._sum.amount || 0;
      treasuryMap[method].txCount += e._count.id || 0;
    }

    for (const p of purchasesByMethod) {
      const method = p.paymentMethod || 'CASH';
      ensureMethod(method);
      treasuryMap[method].expenses += p._sum.amount || 0;
      treasuryMap[method].txCount += p._count.id || 0;
    }

    for (const fr of financialRecords) {
      const method = fr.paymentMethod || 'CASH';
      ensureMethod(method);
      if (fr.type === 'ASSET' || fr.type === 'EQUITY') {
        treasuryMap[method].capitalInject += fr.amount;
        treasuryMap[method].income += fr.amount;
      }
    }

    for (const method of Object.keys(treasuryMap)) {
      treasuryMap[method].balance = treasuryMap[method].income - treasuryMap[method].expenses;
    }

    const totalIncome = Object.values(treasuryMap).reduce((acc, v) => acc + v.income, 0);
    const totalExpenses = Object.values(treasuryMap).reduce((acc, v) => acc + v.expenses, 0);
    const totalBalance = totalIncome - totalExpenses;

    // Recent movements (last 10 disbursements)
    const recentExpenses = await prisma.expense.findMany({
      where: { storeId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        amount: true,
        date: true,
        category: true,
        paymentMethod: true,
      }
    });

    const recentPurchases = await prisma.purchase.findMany({
      where: { storeId, isPaid: true, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        paymentMethod: true,
      }
    });

    const recentDisbursements = [
      ...recentExpenses,
      ...recentPurchases.map(p => ({
        id: p.id,
        name: p.description || 'Achat de produits',
        amount: p.amount,
        date: p.date,
        category: 'Achat',
        paymentMethod: p.paymentMethod,
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    // Recent capital/asset entries
    const recentCapitalEntries = await prisma.financialRecord.findMany({
      where: { 
        storeId, 
        date: { gte: startDate, lte: endDate },
        type: { in: ['ASSET', 'EQUITY'] }
      },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        date: true,
        notes: true,
        paymentMethod: true,
      }
    });

    return {
      byMethod: treasuryMap,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalBalance
      },
      recentDisbursements,
      recentCapitalEntries
    };
  }
}
