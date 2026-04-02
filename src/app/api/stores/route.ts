import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, storeId } = session.user as any;

    let stores = [];
    if (role === 'OWNER') {
      stores = await prisma.store.findMany();
    } else {
      stores = await prisma.store.findMany({
        where: { id: storeId }
      });
    }

    return NextResponse.json(stores);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
