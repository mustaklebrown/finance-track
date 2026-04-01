import { NextRequest, NextResponse } from 'next/server';
import { ChartService } from '@/services/chart.service';

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

  const startDate = new Date(req.nextUrl.searchParams.get('startDate') || '2025-01-01');
  const endDate = new Date(req.nextUrl.searchParams.get('endDate') || '2025-12-31');

  try {
    const salesByCategory = await ChartService.getSalesByCategory(storeId, startDate, endDate);
    return NextResponse.json(salesByCategory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
