import prisma from '../lib/prisma';

export class AccountingService {
  /**
   * Calculate Balance Sheet (Bilan)
   * Assets (Actifs): Cash, Bank, Stock Value, Customer Receivables
   * Liabilities (Passifs): Capital, Loans, Supplier Debts (Dettes Fournisseurs)
   */
  static async getBalanceSheet(storeId: string) {
    // 1. Assets from Financial Records by payment method
    const financialAssets = await prisma.financialRecord.aggregate({
      where: { storeId, type: 'ASSET' },
      _sum: { amount: true }
    });

    // 1b. Assets broken down by payment method for treasury sync
    const assetsByMethod = await prisma.financialRecord.groupBy({
      by: ['paymentMethod'],
      where: { storeId, type: 'ASSET' },
      _sum: { amount: true }
    });

    const assetBreakdown: Record<string, number> = {};
    for (const a of assetsByMethod) {
      assetBreakdown[a.paymentMethod || 'CASH'] = a._sum.amount || 0;
    }

    // 2. Stock Value (Current stock * purchase price)
    const products = await prisma.product.findMany({
      where: { storeId },
      select: { stockLevel: true, purchasePrice: true }
    });
    const stockValue = products.reduce((acc, p) => acc + (p.stockLevel * p.purchasePrice), 0);

    // 3. Liabilities from Financial Records (Loans, etc.)
    const financialLiabilities = await prisma.financialRecord.aggregate({
      where: { storeId, type: 'LIABILITY' },
      _sum: { amount: true }
    });

    // 4. Supplier Debts (Unpaid Purchases)
    const unpaidPurchases = await prisma.purchase.aggregate({
      where: { storeId, isPaid: false },
      _sum: { amount: true }
    });

    // 5. Equity (Capital) by payment method
    const equity = await prisma.financialRecord.aggregate({
      where: { storeId, type: 'EQUITY' },
      _sum: { amount: true }
    });

    const equityByMethod = await prisma.financialRecord.groupBy({
      by: ['paymentMethod'],
      where: { storeId, type: 'EQUITY' },
      _sum: { amount: true }
    });

    const equityBreakdown: Record<string, number> = {};
    for (const e of equityByMethod) {
      equityBreakdown[e.paymentMethod || 'CASH'] = e._sum.amount || 0;
    }

    const totalAssets = (financialAssets._sum.amount || 0) + stockValue;
    const totalLiabilities = (financialLiabilities._sum.amount || 0) + (unpaidPurchases._sum.amount || 0);
    const totalEquity = equity._sum.amount || 0;

    return {
      assets: {
        financial: financialAssets._sum.amount || 0,
        byMethod: assetBreakdown,
        stock: stockValue,
        total: totalAssets
      },
      liabilities: {
        financial: financialLiabilities._sum.amount || 0,
        supplierDebts: unpaidPurchases._sum.amount || 0,
        total: totalLiabilities
      },
      equity: {
        capital: totalEquity,
        byMethod: equityBreakdown,
        total: totalEquity
      },
      ratios: {
        solvency: totalLiabilities > 0 ? (totalAssets / totalLiabilities) : 100,
        autonomy: (totalAssets > 0) ? (totalEquity / totalAssets) * 100 : 0
      }
    };
  }

  static async getSIG(storeId: string, startDate: Date, endDate: Date) {
    // 1. Chiffre d'Affaires (CA)
    const sales = await prisma.sale.aggregate({
      where: { storeId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true }
    });
    const CA = sales._sum.totalAmount || 0;

    // 2. Coût d'Achat des Marchandises Vendues (COGS)
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { storeId, createdAt: { gte: startDate, lte: endDate } } },
      select: { quantity: true, unitCost: true }
    });
    const COGS = saleItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

    // 3. Marge Commerciale (Marge Brute)
    const margeBrute = CA - COGS;

    // 4. Catégorisation des dépenses
    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      where: { storeId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true }
    });

    let chargesExternes = 0; // Marketing, Variable, Autre
    let chargesPersonnel = 0; // Fixed (Loyer, Salaire)

    expenses.forEach(exp => {
      const amount = exp._sum.amount || 0;
      if (exp.category === 'Fixed') {
        chargesPersonnel += amount;
      } else {
        chargesExternes += amount;
      }
    });

    // 5. Valeur Ajoutée (VA)
    const valeurAjoutee = margeBrute - chargesExternes;

    // 6. Excédent Brut d'Exploitation (EBE)
    const ebe = valeurAjoutee - chargesPersonnel;

    // 7. Résultat d'Exploitation (REX) & Résultat Net (RN)
    // En l'absence d'amortissements et d'impôts configurés, ils sont égaux à l'EBE pour le moment
    const rex = ebe;
    const resultatNet = rex;

    return {
      chiffreAffaires: CA,
      achatConsommes: COGS,
      margeBrute,
      chargesExternes,
      valeurAjoutee,
      chargesPersonnel,
      ebe,
      rex,
      resultatNet
    };
  }
}
