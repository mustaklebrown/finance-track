import { NextRequest, NextResponse } from 'next/server';
import { ChartService } from '@/services/chart.service';

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

  const year = parseInt(req.nextUrl.searchParams.get('year') || '2025');

  try {
    const revenueVsExpenses = await ChartService.getRevenueVsExpensesByMonth(storeId, year);
    return NextResponse.json(revenueVsExpenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
