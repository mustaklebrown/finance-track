import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const store = await prisma.store.findFirst();
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 });
    }
    return NextResponse.json(store);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
