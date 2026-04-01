import { NextResponse } from 'next/server';
import { ProductService } from '@/services/product.service';
import { ProductSchema } from '@/lib/validations/product';
import { z } from 'zod';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // For single-field patches (stockLevel, isFollowed, status), skip Zod refinement
    const DIRECT_PATCH_FIELDS = ['isFollowed', 'stockLevel', 'status'];
    const keys = Object.keys(body);

    if (keys.length > 0 && keys.every(k => DIRECT_PATCH_FIELDS.includes(k))) {
      const product = await ProductService.update(id, body);
      return NextResponse.json(product);
    }

    // For full/multi-field updates, use the base schema without the refine
    const BaseSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      sku: z.string().max(50).optional().nullable(),
      purchasePrice: z.coerce.number().min(0).optional(),
      sellingPrice: z.coerce.number().min(0).optional(),
      stockLevel: z.coerce.number().int().min(0).optional(),
      lowStockAlert: z.coerce.number().int().min(0).optional(),
      categoryId: z.string().optional().nullable(),
      isFollowed: z.boolean().optional(),
      status: z.string().optional(),
    });

    const validated = BaseSchema.parse(body);
    const product = await ProductService.update(id, {
      ...validated,
      categoryId: validated.categoryId || undefined,
      sku: validated.sku ?? undefined,
    });

    return NextResponse.json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await ProductService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
