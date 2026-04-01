import { NextRequest, NextResponse } from 'next/server';
import { KPIService } from '@/services/kpi.service';

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

  const startDate = new Date(req.nextUrl.searchParams.get('startDate') || '2024-01-01');
  const endDate = new Date(req.nextUrl.searchParams.get('endDate') || '2025-12-31');

  try {
    const margins = await KPIService.getMargins(storeId, startDate, endDate);
    const cac = await KPIService.getCAC(storeId, startDate, endDate);
    const ltv = await KPIService.getLTV(storeId);

    return NextResponse.json({
      margins,
      cac,
      ltv,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
