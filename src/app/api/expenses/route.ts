import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';
import { z } from 'zod';

const ExpenseSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  amount: z.number().min(0, 'Le montant doit être positif'),
  date: z.string(),
  category: z.string().min(1, 'La catégorie est requise')
});

export async function POST(req: Request) {
  try {
    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 });

    const body = await req.json();
    const validated = ExpenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
         name: validated.name,
         amount: validated.amount,
         date: new Date(validated.date),
         category: validated.category,
         storeId: store.id
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 });

    const expenses = await prisma.expense.findMany({
      where: { storeId: store.id },
      orderBy: { date: 'desc' },
      take: 50
    });
    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
