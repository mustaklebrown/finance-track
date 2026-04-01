import prisma from '../lib/prisma';

export class AccountingService {
  /**
   * Calculate Balance Sheet (Bilan)
   * Assets (Actifs): Cash, Bank, Stock Value, Customer Receivables
   * Liabilities (Passifs): Capital, Loans, Supplier Debts (Dettes Fournisseurs)
   */
  static async getBalanceSheet(storeId: string) {
    // 1. Assets from Financial Records (Cash/Bank)
    const financialAssets = await prisma.financialRecord.aggregate({
      where: { storeId, type: 'ASSET' },
      _sum: { amount: true }
    });

    // 2. Stock Value (Current stock * purchase price)
    const products = await prisma.product.findMany({
      where: { storeId },
      select: { stockLevel: true, purchasePrice: true }
    });
    const stockValue = products.reduce((acc, p) => acc + (p.stockLevel * p.purchasePrice), 0);

    // 3. Customer Receivables (Not implemented yet, assuming 0 for now or based on Sales if we add isPaid)
    // For now, let's just focus on what we have

    // 4. Liabilities from Financial Records (Loans, etc.)
    const financialLiabilities = await prisma.financialRecord.aggregate({
      where: { storeId, type: 'LIABILITY' },
      _sum: { amount: true }
    });

    // 5. Supplier Debts (Unpaid Purchases)
    const unpaidPurchases = await prisma.purchase.aggregate({
      where: { storeId, isPaid: false },
      _sum: { amount: true }
    });

    // 6. Equity (Capital)
    const equity = await prisma.financialRecord.aggregate({
      where: { storeId, type: 'EQUITY' },
      _sum: { amount: true }
    });

    const totalAssets = (financialAssets._sum.amount || 0) + stockValue;
    const totalLiabilities = (financialLiabilities._sum.amount || 0) + (unpaidPurchases._sum.amount || 0);
    const totalEquity = equity._sum.amount || 0;

    return {
      assets: {
        financial: financialAssets._sum.amount || 0,
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
