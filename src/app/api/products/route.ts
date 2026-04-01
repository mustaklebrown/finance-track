import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProductService } from '@/services/product.service';
import { ProductSchema } from '@/lib/validations/product';
import { z } from 'zod';

export async function GET() {
  try {
    const store = await prisma.store.findFirst();
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 });
    }

    const products = await ProductService.list(store.id);
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const store = await prisma.store.findFirst();
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 });
    }

    const body = await req.json();
    const validated = ProductSchema.parse(body);

    const product = await ProductService.create(store.id, {
      ...validated,
      categoryId: validated.categoryId || undefined, // Convert empty string to undefined for Prisma
      sku: validated.sku ?? undefined, // Convert null to undefined for type compatibility
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
