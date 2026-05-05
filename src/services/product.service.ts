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

  static async create(storeId: string, data: CreateProductData & { paymentMethod?: string }) {
    const { paymentMethod, ...productData } = data;
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          storeId,
        },
      });

      // If initial stock is greater than 0, create an automatic expense for the inventory purchase
      if (productData.stockLevel && productData.stockLevel > 0) {
        const inventoryCost = productData.purchasePrice * productData.stockLevel;
        await tx.expense.create({
          data: {
            name: `Achat stock initial: ${productData.name}`,
            amount: inventoryCost,
            date: new Date(),
            category: 'Achat Stock',
            paymentMethod: paymentMethod || 'CASH',
            storeId,
          }
        });
      }

      return product;
    });
  }

  static async update(id: string, data: Partial<CreateProductData> & { paymentMethod?: string }) {
    const { paymentMethod, ...productData } = data;
    return await prisma.$transaction(async (tx) => {
      const oldProduct = await tx.product.findUnique({ where: { id } });
      if (!oldProduct) throw new Error('Product not found');

      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData as any,
      });

      // Handle stock and expenses
      if (productData.stockLevel !== undefined && productData.stockLevel !== oldProduct.stockLevel) {
        const diff = productData.stockLevel - oldProduct.stockLevel;
        
        await tx.stockMovement.create({
          data: {
            productId: id,
            quantity: diff,
            type: 'ADJUSTMENT',
            reason: 'Mise à jour manuelle'
          }
        });

        // If stock is INCREASED, money must have been spent to buy it (Cash flow decrease)
        if (diff > 0) {
          const costToBuy = (productData.purchasePrice ?? oldProduct.purchasePrice) * diff;
          await tx.expense.create({
            data: {
              name: `Restockage: ${updatedProduct.name} (+${diff} unités)`,
              amount: costToBuy,
              date: new Date(),
              category: 'Achat Stock',
              paymentMethod: paymentMethod || 'CASH',
              storeId: oldProduct.storeId,
            }
          });
        }
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
