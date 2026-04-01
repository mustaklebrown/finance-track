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
}
