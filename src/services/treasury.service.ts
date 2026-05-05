import prisma from '../lib/prisma';

export class TreasuryService {
  /**
   * Calculates the real-time treasury (trésorerie immédiate) for a store.
   * Treasury = Total Sales Income - Total Expenses (by payment method)
   * This gives an accurate picture of how much cash/money is in each "account".
   */
  static async getTreasury(storeId: string) {
    // 1. Sales income grouped by paymentMethod
    const salesByMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { storeId },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    // 2. Expenses (including disbursements for product purchases) grouped by paymentMethod
    const expensesByMethod = await prisma.expense.groupBy({
      by: ['paymentMethod'],
      where: { storeId },
      _sum: { amount: true },
      _count: { id: true }
    });

    // 3. Build a unified treasury map per payment method
    const methods = ['CASH', 'BANK', 'MOBILE', 'MOBILE_MONEY'];
    const treasuryMap: Record<string, { income: number; expenses: number; balance: number; txCount: number }> = {};

    // Initialize all methods
    for (const m of methods) {
      treasuryMap[m] = { income: 0, expenses: 0, balance: 0, txCount: 0 };
    }

    // Fill with sales income
    for (const s of salesByMethod) {
      const method = s.paymentMethod || 'CASH';
      if (!treasuryMap[method]) {
        treasuryMap[method] = { income: 0, expenses: 0, balance: 0, txCount: 0 };
      }
      treasuryMap[method].income += s._sum.totalAmount || 0;
      treasuryMap[method].txCount += s._count.id || 0;
    }

    // Fill with expenses (disbursements)
    for (const e of expensesByMethod) {
      const method = e.paymentMethod || 'CASH';
      if (!treasuryMap[method]) {
        treasuryMap[method] = { income: 0, expenses: 0, balance: 0, txCount: 0 };
      }
      treasuryMap[method].expenses += e._sum.amount || 0;
      treasuryMap[method].txCount += e._count.id || 0;
    }

    // Calculate balance for each method
    for (const method of Object.keys(treasuryMap)) {
      treasuryMap[method].balance = treasuryMap[method].income - treasuryMap[method].expenses;
    }

    // 4. Compute totals
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
   * Gets treasury for a specific date range (e.g. today, this month)
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

    const methods = ['CASH', 'BANK', 'MOBILE', 'MOBILE_MONEY'];
    const treasuryMap: Record<string, { income: number; expenses: number; balance: number; txCount: number }> = {};

    for (const m of methods) {
      treasuryMap[m] = { income: 0, expenses: 0, balance: 0, txCount: 0 };
    }

    for (const s of salesByMethod) {
      const method = s.paymentMethod || 'CASH';
      if (!treasuryMap[method]) {
        treasuryMap[method] = { income: 0, expenses: 0, balance: 0, txCount: 0 };
      }
      treasuryMap[method].income += s._sum.totalAmount || 0;
      treasuryMap[method].txCount += s._count.id || 0;
    }

    for (const e of expensesByMethod) {
      const method = e.paymentMethod || 'CASH';
      if (!treasuryMap[method]) {
        treasuryMap[method] = { income: 0, expenses: 0, balance: 0, txCount: 0 };
      }
      treasuryMap[method].expenses += e._sum.amount || 0;
      treasuryMap[method].txCount += e._count.id || 0;
    }

    for (const method of Object.keys(treasuryMap)) {
      treasuryMap[method].balance = treasuryMap[method].income - treasuryMap[method].expenses;
    }

    const totalIncome = Object.values(treasuryMap).reduce((acc, v) => acc + v.income, 0);
    const totalExpenses = Object.values(treasuryMap).reduce((acc, v) => acc + v.expenses, 0);
    const totalBalance = totalIncome - totalExpenses;

    // Recent movements (last 10 disbursements)
    const recentDisbursements = await prisma.expense.findMany({
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

    return {
      byMethod: treasuryMap,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalBalance
      },
      recentDisbursements
    };
  }
}
