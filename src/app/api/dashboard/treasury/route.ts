import { NextRequest, NextResponse } from 'next/server';
import { TreasuryService } from '@/services/treasury.service';
import { getAuthorizedStoreId } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const storeId = await getAuthorizedStoreId();

    const startDateParam = req.nextUrl.searchParams.get('startDate');
    const endDateParam = req.nextUrl.searchParams.get('endDate');

    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      const data = await TreasuryService.getTreasuryForPeriod(storeId, startDate, endDate);
      return NextResponse.json(data);
    }

    // Default: all-time treasury
    const data = await TreasuryService.getTreasury(storeId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Treasury API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
