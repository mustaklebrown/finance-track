import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';
import { z } from 'zod';

const RestockSchema = z.object({
  quantity: z.coerce.number().int().positive('La quantité doit être un entier positif'),
  purchasePrice: z.coerce.number().min(0, 'Le prix d\'achat doit être positif').optional(),
  paymentMethod: z.string().optional().default('CASH')
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authorization
    const storeId_auth = await getAuthorizedStoreId();
    
    const body = await req.json();
    const validated = RestockSchema.parse(body);
    const { quantity, purchasePrice, paymentMethod } = validated;

    console.log(`Restocking product ${id} for store ${storeId_auth}:`, validated);

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.storeId !== storeId_auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const finalPurchasePrice = purchasePrice !== undefined ? purchasePrice : product.purchasePrice;
    const costToBuy = finalPurchasePrice * quantity;

    // Use sequential operations instead of interactive transaction
    // (interactive transactions are unreliable with Neon pooler + @prisma/adapter-pg)
    
    // Step 1: Update product stock
    console.log('Step 1: Updating product stock...');
    const updated = await prisma.product.update({
      where: { id },
      data: {
        stockLevel: product.stockLevel + quantity,
        purchasePrice: finalPurchasePrice
      }
    });

    // Step 2: Record stock movement
    console.log('Step 2: Creating stock movement...');
    await prisma.stockMovement.create({
      data: {
        productId: id,
        quantity: quantity,
        type: 'RESTOCK',
        reason: 'Achat / Approvisionnement'
      }
    });

    // Step 3: Register the disbursement (expense)
    console.log('Step 3: Creating expense...');
    await prisma.expense.create({
      data: {
        name: `Achat stock: ${product.name} (+${quantity} unités)`,
        amount: costToBuy,
        date: new Date(),
        category: 'Achat Stock',
        paymentMethod: paymentMethod,
        storeId: storeId_auth,
      }
    });

    console.log('Restock completed successfully.');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('RESTOCK API ERROR:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
    }, { status: 500 });
  }
}
