import prisma from '../lib/prisma';
import { CategorySchema } from '../lib/validations/category';

export class CategoryService {
  static async list(storeId: string) {
    return await prisma.category.findMany({
      where: { storeId },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' },
    });
  }

  static async create(storeId: string, data: { name: string }) {
    // Validate again at service level just in case
    const validated = CategorySchema.parse(data);
    return await prisma.category.create({
      data: {
        name: validated.name,
        storeId,
      },
    });
  }

  static async update(id: string, data: { name: string }) {
    const validated = CategorySchema.parse(data);
    return await prisma.category.update({
      where: { id },
      data: { name: validated.name },
    });
  }

  static async delete(id: string) {
    // Note: Due to SetNull or Cascade in schema, related products 
    // will have categoryId set to null or cascade depending on schema.
    // In our schema: products Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
    return await prisma.category.delete({
      where: { id },
    });
  }
}
