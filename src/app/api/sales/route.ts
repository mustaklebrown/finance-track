import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';
import { z } from 'zod';

const SaleSchema = z.object({
  totalAmount: z.number().min(0),
  amountGiven: z.number().min(0).optional(),
  changeReturned: z.number().min(0).optional(),
  date: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    unitCost: z.number().min(0)
  })).min(1)
});

export async function POST(req: Request) {
  try {
    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 });

    const body = await req.json();
    const validated = SaleSchema.parse(body);

    const saleDate = validated.date ? new Date(validated.date) : new Date();

    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const s = await tx.sale.create({
        data: {
          totalAmount: validated.totalAmount,
          amountGiven: validated.amountGiven,
          changeReturned: validated.changeReturned,
          createdAt: saleDate,
          storeId: store.id,
          items: {
            create: validated.items.map(item => ({
               quantity: item.quantity,
               unitPrice: item.unitPrice,
               unitCost: item.unitCost,
               productId: item.productId,
               createdAt: saleDate
            }))
          }
        },
        include: { items: { include: { product: true } } }
      });

      // Deduct stock and record movements
      for (const item of validated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockLevel: { decrement: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'SALE',
            reason: `Vente #${s.id.slice(0, 8)}`,
            createdAt: saleDate
          }
        });
      }

      return s;
    });

    return NextResponse.json(sale, { status: 201 });
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

    const sales = await prisma.sale.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
