import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const store = await prisma.store.findFirst();
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const { id: productId } = await params;
    const body = await req.json();
    const { name, channel, budget, startDate, endDate } = body;

    if (!name || !channel || typeof budget !== 'number' || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        channel,
        budget,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        productId,
        storeId: store.id
      }
    });

    // Optionnel : Ajouter automatiquement le budget marketing dans les Dépenses (Expenses)
    // Pour que le SIG global reste synchronisé !
    await prisma.expense.create({
      data: {
        name: `Campagne: ${name} (Produit cible)`,
        amount: budget,
        date: new Date(startDate),
        category: 'Marketing',
        storeId: store.id
      }
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
