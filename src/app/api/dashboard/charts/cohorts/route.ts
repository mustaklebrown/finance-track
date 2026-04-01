import { NextRequest, NextResponse } from 'next/server';
import { ChartService } from '@/services/chart.service';

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

  try {
    const cohorts = await ChartService.getCohortAnalytics(storeId);
    return NextResponse.json(cohorts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
