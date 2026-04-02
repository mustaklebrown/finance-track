import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';
import { AccountingService } from '@/services/accounting.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!storeId) {
      const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
      if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      return NextResponse.json(await getData(store.id, startDateStr, endDateStr));
    }

    return NextResponse.json(await getData(storeId, startDateStr, endDateStr));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

async function getData(storeId: string, startDateStr: string | null, endDateStr: string | null) {
  const now = new Date();
  const startDate = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const balanceSheet = await AccountingService.getBalanceSheet(storeId);
  const sig = await AccountingService.getSIG(storeId, startDate, endDate);
  
  const records = await prisma.financialRecord.findMany({
    where: { storeId },
    orderBy: { date: 'desc' },
    take: 50
  });

  return {
    balanceSheet,
    sig,
    records,
    period: { startDate, endDate }
  };
}

export async function POST(req: Request) {
  try {
    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const body = await req.json();
    const { type, category, amount, date, notes } = body;

    const record = await prisma.financialRecord.create({
      data: {
        type,
        category,
        amount,
        date: date ? new Date(date) : undefined,
        notes,
        storeId: store.id
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
