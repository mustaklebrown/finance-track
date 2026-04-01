import { NextResponse } from 'next/server';
import { ChartService } from '../../../services/chart.service';
import { KPIService } from '../../../services/kpi.service';

/**
 * Exemple de structure API Next.js App Router
 * Route: GET /api/charts
 * Renvoie un dashboard de données aggrégées pour les graphiques et kpis.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    // --- Exécution en parallèle des services pour des performances optimales ---
    const [
      areaChartData,
      pieChartData,
      cohortData,
      margins,
      cacData,
      ltvData
    ] = await Promise.all([
      ChartService.getRevenueVsExpensesByMonth(storeId, year),
      ChartService.getSalesByCategory(storeId, startDate, endDate),
      ChartService.getCohortAnalytics(storeId),
      KPIService.getMargins(storeId, startDate, endDate),
      KPIService.getCAC(storeId, startDate, endDate),
      KPIService.getLTV(storeId),
    ]);

    // --- Format de réponse unifiée JSON ---
    // Optimisé pour une consommation directe par les composants UI du dashboard.
    return NextResponse.json({
      success: true,
      charts: {
        areaChart: areaChartData, // Ex: { series: [{ name: "Janv.", revenu: 15000, depense: 8000 }] }
        pieChart: pieChartData,   // Ex: { categories: [{ name: 'Électronique', value: 45000, fill: '#0088FE' }] }
        cohorts: cohortData,      // Ex: { retention: [{ cohort: '2025-01', totalCustomers: 50, retentionRates: ['50%', '30%'] }] }
      },
      kpis: {
        margins,
        cac: cacData,
        ltv: ltvData,
      }
    });

  } catch (error) {
    console.error('API /charts Error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l’agrégation des données' },
      { status: 500 }
    );
  }
}
