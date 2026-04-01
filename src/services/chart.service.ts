import prisma from '../lib/prisma';

export class ChartService {
  /**
   * Structure de réponse optimisée pour un graphique en aires (Area Chart)
   * Affiche les revenus versus les dépenses fixes sur 12 mois (ou sur une période donnée).
   * Parfait pour Recharts ou Shadcn (ex. series: [{ name: 'Revenus', data: ... }, { name: 'Dépenses', data: ... }])
   */
  static async getRevenueVsExpensesByMonth(storeId: string, year: number) {
    // 1. Agréger les ventes par mois (Prisma `groupBy` sur une fonction date est limité en PostgreSQL,
    // on va plutôt ramener les ventes de l'année et grouper dynamiquement côté serveur)
    const sales = await prisma.sale.findMany({
      where: {
        storeId,
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00Z`),
          lte: new Date(`${year}-12-31T23:59:59Z`),
        },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        storeId,
        date: {
          gte: new Date(`${year}-01-01T00:00:00Z`),
          lte: new Date(`${year}-12-31T23:59:59Z`),
        },
      },
      select: { date: true, amount: true },
    });

    // Initialisation du tableau avec 12 mois
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('fr-FR', { month: 'short' }), // "janv.", "févr."...
      revenu: 0,
      depense: 0,
    }));

    // Grouper les revenus
    sales.forEach((sale: { createdAt: Date; totalAmount: number }) => {
      const monthIndex = sale.createdAt.getMonth();
      monthlyData[monthIndex].revenu += sale.totalAmount;
    });

    // Grouper les dépenses
    expenses.forEach((exp: { date: Date; amount: number }) => {
      const monthIndex = exp.date.getMonth();
      monthlyData[monthIndex].depense += exp.amount;
    });

    return monthlyData; // Prêt pour `<AreaChart data={data}>`
  }

  /**
   * Données pour un graphique circulaire (Pie/Donut Chart)
   * Répartition des ventes par catégorie.
   */
  static async getSalesByCategory(
    storeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // On peut joindre explicitement via SaleItem -> Product -> Category
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          storeId,
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    // Agrégation manuelle par catégorie
    const categoryMap = new Map<string, { value: number; fill: string }>();
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    saleItems.forEach((item: any) => { // Using any for brevity here as types are complex, but can be refined
      const categoryName = item.product.category?.name || 'Non Catégorisé';
      const itemTotal = item.unitPrice * item.quantity;

      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.value += itemTotal;
      } else {
        categoryMap.set(categoryName, {
          value: itemTotal,
          // Attribution pseudo-aléatoire de couleurs
          fill: colors[categoryMap.size % colors.length],
        });
      }
    });

    const data = Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      value: stats.value,
      fill: stats.fill,
    }));

    return data; // Prêt pour `<PieChart><Pie data={data} /></PieChart>`
  }

  /**
   * Dashboard d'analyse de cohortes (Rétention client)
   * Calcule le % de clients qui ont fait un nouvel achat X mois après leur premier achat.
   */
  static async getCohortAnalytics(storeId: string) {
    // 1. Remonter toutes les transactions liées à un client pour notre algorithme
    const sales = await prisma.sale.findMany({
      where: { storeId, customerId: { not: null } },
      select: { customerId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Map pour stocker la première date d'achat du client et ses futurs mois d'achats
    const cohorts: Record<
      string,
      { totalCustomers: number; retentionByMonth: Record<number, Set<string>> }
    > = {};
    const firstPurchaseMap = new Map<string, Date>();

    sales.forEach((sale: { customerId: string | null; createdAt: Date }) => {
      if (!sale.customerId) return;
      const date = sale.createdAt;

      let firstDate = firstPurchaseMap.get(sale.customerId);
      if (!firstDate) {
        firstDate = date;
        firstPurchaseMap.set(sale.customerId, firstDate);

        // Cohorte clé: ex: "2025-01"
        const cohortKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;

        if (!cohorts[cohortKey]) {
          cohorts[cohortKey] = { totalCustomers: 0, retentionByMonth: {} };
        }
        cohorts[cohortKey].totalCustomers++;
      } else {
        // Calcul du mois courant (Month N) depuis la firstDate
        const monthDiff =
          (date.getFullYear() - firstDate.getFullYear()) * 12 +
          (date.getMonth() - firstDate.getMonth());

        // C'est un rachat sur un autre mois de rétention
        if (monthDiff > 0) {
          const cohortKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;

          if (!cohorts[cohortKey].retentionByMonth[monthDiff]) {
            cohorts[cohortKey].retentionByMonth[monthDiff] = new Set();
          }
          cohorts[cohortKey].retentionByMonth[monthDiff].add(sale.customerId);
        }
      }
    });

    // Transformation pour l'API finale: on renvoie un JSON propre
    const finalCohorts = Object.entries(cohorts).map(([cohortName, data]) => {
      const maxMonthsRetention = Math.max(
        0,
        ...Object.keys(data.retentionByMonth).map(Number),
      );
      const retentionRates = [];

      for (let m = 1; m <= maxMonthsRetention; m++) {
        const retainedCount = data.retentionByMonth[m]?.size || 0;
        retentionRates.push((retainedCount / data.totalCustomers) * 100);
      }

      return {
        cohort: cohortName,
        totalCustomers: data.totalCustomers,
        retentionRates: retentionRates.map((rate) => rate.toFixed(1) + '%'),
      };
    });

    return finalCohorts;
  }
}
