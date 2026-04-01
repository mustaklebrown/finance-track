import { NextRequest, NextResponse } from 'next/server';
import { KPIService } from '@/services/kpi.service';

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

  const startDate = new Date(req.nextUrl.searchParams.get('startDate') || '2024-01-01');
  const endDate = new Date(req.nextUrl.searchParams.get('endDate') || '2025-12-31');

  try {
    const performance = await KPIService.getStorePerformance(storeId, startDate, endDate);
    const categories = await KPIService.getCategoryAnalysis(storeId);

    return NextResponse.json({
      performance,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
