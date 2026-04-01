import prisma from '../lib/prisma';

export class KPIService {
  /**
   * Calcule la marge nette et la marge brute pour une période donnée.
   * Marge Brute = Chiffre d'Affaires - Coût des marchandises vendues (COGS)
   * Marge Nette = Marge Brute - Dépenses fixes
   */
  static async getMargins(storeId: string, startDate: Date, endDate: Date) {
    // 1. Récupérer toutes les ventes et leurs items (CA & COGS)
    const sales = await prisma.sale.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: true,
      },
    });

    let totalRevenue = 0;
    let totalCogs = 0;

    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      for (const item of sale.items) {
        // Le COGS est figé lors de la vente pour garder un historique juste
        totalCogs += (item.unitCost * item.quantity);
      }
    }

    const grossMargin = totalRevenue - totalCogs;

    // 2. Récupérer les dépenses fixes
    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        storeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalExpenses = expenses._sum.amount || 0;
    const netMargin = grossMargin - totalExpenses;

    return {
      totalRevenue,
      totalCogs,
      grossMargin,
      totalExpenses,
      netMargin,
      grossMarginPercentage: totalRevenue ? (grossMargin / totalRevenue) * 100 : 0,
      netMarginPercentage: totalRevenue ? (netMargin / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Calcul du Coût d'Acquisition Client (CAC)
   * CAC = Total des dépenses marketing / Nombre de nouveaux clients acquis
   */
  static async getCAC(storeId: string, startDate: Date, endDate: Date) {
    // 1. Dépenses marketing sur la période
    const campaigns = await prisma.campaign.aggregate({
      _sum: { budget: true },
      where: {
        storeId,
        startDate: { gte: startDate },
        // Approximation: on prend le budget alloué sur les campagnes démarrant dans la période
      },
    });
    
    const marketingSpend = campaigns._sum.budget || 0;

    // 2. Nouveaux clients créés pendant la période
    const newCustomersCount = await prisma.customer.count({
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      marketingSpend,
      newCustomersCount,
      cac: newCustomersCount > 0 ? (marketingSpend / newCustomersCount) : 0,
    };
  }

  /**
   * Taux de conversion par source
   * Note: En l'absence de données de trafic web métier (visites réelles), 
   * ce taux compare l'efficacité relative des sources de clients existantes 
   * et de la conversion visiteur -> client si on fournit le nombre de visites (traffic)
   */
  static async getConversionRateByCampaign(storeId: string, campaignId: string, totalVisitors: number) {
    // Calcul des clients acquis via cette campagne spécifique
    const conversions = await prisma.customer.count({
      where: {
        storeId,
        campaignId: campaignId,
      },
    });

    return {
      totalVisitors,
      conversions,
      conversionRate: totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0,
    };
  }

  /**
   * Lifetime Value (LTV) moyenne des clients
   * LTV = Revenu total généré / Nombre total de clients uniques ayants fait un achat
   */
  static async getLTV(storeId: string) {
    // 1. Chiffre d'affaires global généré par les clients identifiés
    const salesAggregate = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: {
        storeId,
        customerId: { not: null },
      },
    });

    const totalRevenueFromCustomers = salesAggregate._sum.totalAmount || 0;

    // 2. Nombre de clients uniques ayant effectué un achat
    const uniqueCustomers = await prisma.sale.findMany({
      where: {
        storeId,
        customerId: { not: null },
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });

    const buyingCustomersCount = uniqueCustomers.length;

    return {
      totalRevenueFromCustomers,
      buyingCustomersCount,
      ltv: buyingCustomersCount > 0 ? totalRevenueFromCustomers / buyingCustomersCount : 0,
    };
  }

  /**
   * Performance globale du store
   * Top produits, panier moyen
   */
  static async getStorePerformance(storeId: string, startDate: Date, endDate: Date) {
    // 1. Panier Moyen (Average Ticket Value)
    const salesAgg = await prisma.sale.aggregate({
      _avg: { totalAmount: true },
      _count: { id: true },
      where: { storeId, createdAt: { gte: startDate, lte: endDate } }
    });

    const averageTicket = salesAgg._avg.totalAmount || 0;
    const totalTransactions = salesAgg._count.id || 0;

    // 2. Top Produits par Revenu
    const topProductsRaw = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, unitPrice: true },
      where: { sale: { storeId }, createdAt: { gte: startDate, lte: endDate } },
      orderBy: { _sum: { unitPrice: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true }
      });
      return {
        name: product?.name || 'Inconnu',
        quantity: item._sum.quantity || 0,
        revenue: (item._sum.unitPrice || 0) * (item._sum.quantity || 0) // Approximation based on total value recorded
      };
    }));

    return {
      averageTicket,
      totalTransactions,
      topProducts
    };
  }

  /**
   * Analyse détaillée par catégorie
   * Marge par catégorie, volume vs valeur
   */
  static async getCategoryAnalysis(storeId: string) {
    const categories = await prisma.category.findMany({
      where: { storeId },
      include: {
        products: {
          include: {
            saleItems: true
          }
        }
      }
    });

    const analysis = categories.map(cat => {
      let revenue = 0;
      let cost = 0;
      let quantity = 0;

      cat.products.forEach(prod => {
        prod.saleItems.forEach(item => {
          revenue += item.unitPrice * item.quantity;
          cost += item.unitCost * item.quantity;
          quantity += item.quantity;
        });
      });

      const margin = revenue - cost;

      return {
        id: cat.id,
        name: cat.name,
        revenue,
        quantity,
        margin,
        marginPercentage: revenue > 0 ? (margin / revenue) * 100 : 0
      };
    });

    return analysis.sort((a, b) => b.revenue - a.revenue);
  }
}
