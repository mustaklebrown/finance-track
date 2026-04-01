import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!sale) {
      return NextResponse.json({ error: 'Vente non trouvée' }, { status: 404 });
    }

    // Restore stock and delete sale in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockLevel: {
              increment: item.quantity
            }
          }
        });
      }

      await tx.sale.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete sale error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { createdAt, totalAmount } = body;

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        createdAt: createdAt ? new Date(createdAt) : undefined,
        totalAmount: totalAmount !== undefined ? totalAmount : undefined,
      }
    });

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
