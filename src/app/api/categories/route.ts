import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CategoryService } from '@/services/category.service';
import { CategorySchema } from '@/lib/validations/category';
import { z } from 'zod';

export async function GET() {
  try {
    const store = await prisma.store.findFirst();
    if (!store) return NextResponse.json([], { status: 404 });

    const categories = await CategoryService.list(store.id);
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const store = await prisma.store.findFirst();
    if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 });

    const body = await req.json();
    const validated = CategorySchema.parse(body);

    const category = await CategoryService.create(store.id, validated);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
