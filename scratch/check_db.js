const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Use a product
    const product = await prisma.product.findFirst();
    if (!product) {
      console.log('No product found');
      return;
    }
    console.log('Product:', product.id, product.name, 'stock:', product.stockLevel);

    const quantity = 1;
    const purchasePrice = product.purchasePrice;
    const paymentMethod = 'CASH';

    // Reproduce the EXACT same transaction as the API
    console.log('\n=== Simulating restock transaction ===');
    const result = await prisma.$transaction(async (tx) => {
      console.log('Step 1: Update product...');
      const updated = await tx.product.update({
        where: { id: product.id },
        data: {
          stockLevel: product.stockLevel + quantity,
          purchasePrice: purchasePrice
        }
      });
      console.log('Step 1 done.');

      console.log('Step 2: Create stock movement...');
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantity: quantity,
          type: 'RESTOCK',
          reason: 'Achat / Approvisionnement'
        }
      });
      console.log('Step 2 done.');

      console.log('Step 3: Create expense...');
      const costToBuy = purchasePrice * quantity;
      await tx.expense.create({
        data: {
          name: `Achat stock: ${product.name} (+${quantity} unités)`,
          amount: costToBuy,
          date: new Date(),
          category: 'Achat Stock',
          paymentMethod: paymentMethod,
          storeId: product.storeId,
        }
      });
      console.log('Step 3 done.');

      return updated;
    }, { timeout: 15000 });

    console.log('\n=== SUCCESS! Product updated:', result.stockLevel);
    
    // Revert the stock change
    await prisma.product.update({
      where: { id: product.id },
      data: { stockLevel: product.stockLevel }
    });
    console.log('Reverted stock.');

  } catch (e) {
    console.error('FULL ERROR:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
