import prisma from '../lib/prisma';

export interface CreateProductData {
  name: string;
  sku?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockLevel?: number;
  lowStockAlert?: number;
  categoryId?: string;
  isFollowed?: boolean;
  status?: string;
}

export class ProductService {
  static async list(storeId: string) {
    return await prisma.product.findMany({
      where: { storeId },
      include: { 
        category: true,
        _count: {
          select: { saleItems: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  static async create(storeId: string, data: CreateProductData) {
    return await prisma.product.create({
      data: {
        ...data,
        storeId,
      },
    });
  }

  static async update(id: string, data: Partial<CreateProductData>) {
    return await prisma.$transaction(async (tx) => {
      const oldProduct = await tx.product.findUnique({ where: { id } });
      if (!oldProduct) throw new Error('Product not found');

      const updatedProduct = await tx.product.update({
        where: { id },
        data,
      });

      // If stockLevel changed, log it (unless it was already handled by a Sale/Restock specific API)
      if (data.stockLevel !== undefined && data.stockLevel !== oldProduct.stockLevel) {
        const diff = data.stockLevel - oldProduct.stockLevel;
        await tx.stockMovement.create({
          data: {
            productId: id,
            quantity: diff,
            type: 'ADJUSTMENT',
            reason: 'Mise à jour manuelle'
          }
        });
      }

      return updatedProduct;
    });
  }

  static async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Find all affected sale items to know which sales need updating
      const itemsToCleanup = await tx.saleItem.findMany({
        where: { productId: id },
        select: { saleId: true, quantity: true, unitPrice: true }
      });

      // 2. Identify unique sales affected
      const affectedSaleIds = Array.from(new Set(itemsToCleanup.map(i => i.saleId)));

      // 3. Delete the sale items first
      await tx.saleItem.deleteMany({
        where: { productId: id }
      });

      // 4. Update or delete affected sales
      for (const saleId of affectedSaleIds) {
        const remainingItems = await tx.saleItem.count({
          where: { saleId: saleId }
        });

        if (remainingItems === 0) {
          // If no items left in this sale, delete the sale itself
          await tx.sale.delete({
            where: { id: saleId }
          });
        } else {
          // Recalculate total amount for the sale from remaining items
          const items = await tx.saleItem.findMany({
            where: { saleId: saleId },
            select: { quantity: true, unitPrice: true }
          });
          const newTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          
          await tx.sale.update({
            where: { id: saleId },
            data: { totalAmount: newTotal }
          });
        }
      }

      // 5. Finally delete the product
      return await tx.product.delete({
        where: { id },
      });
    });
  }
  
  static async toggleFollow(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');
    
    return await prisma.product.update({
      where: { id },
      data: { isFollowed: !product.isFollowed },
    });
  }
}
