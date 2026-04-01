import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const DailySaleSchema = z.object({
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1'),
  date: z.string().min(1, 'La date est requise'),
  unitPrice: z.number().min(0).optional(), // Optional override, defaults to product selling price
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    const store = await prisma.store.findFirst();
    if (!store)
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const body = await req.json();
    const validated = DailySaleSchema.parse(body);

    // Get the product to use its prices
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const unitPrice = validated.unitPrice ?? product.sellingPrice;
    const totalAmount = unitPrice * validated.quantity;
    const saleDate = new Date(validated.date);

    // Update stock and Log movement in transaction
    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.sale.create({
        data: {
          storeId: store.id,
          totalAmount,
          createdAt: saleDate,
          items: {
            create: {
              productId,
              quantity: validated.quantity,
              unitPrice,
              unitCost: product.purchasePrice,
              createdAt: saleDate,
            },
          },
        },
        include: { items: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: { stockLevel: { decrement: validated.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity: -validated.quantity,
          type: 'SALE',
          reason: `Vente #${s.id.slice(0, 8)}`,
          createdAt: saleDate
        }
      });

      return s;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json(
      { error: error.message || 'Error' },
      { status: 500 },
    );
  }
}
