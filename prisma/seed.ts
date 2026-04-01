import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Pourcentage de de remplissage de la base de données...');

  // 1. Nettoyage
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // 2. Création du Store
  const store = await prisma.store.create({
    data: {
      name: 'Ma Super Boutique Finance',
    },
  });

  // 3. Utilisateur
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@finance.com',
      role: 'OWNER',
      storeId: store.id,
      emailVerified: true,
    },
  });

  // Create an account for the user (Better Auth stores password here)
  const hashedPassword = await hashPassword('password123');
  await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountId: adminUser.email,
      providerId: 'credential',
      password: hashedPassword, // Hashed properly so BetterAuth works
    }
  });

  // 4. Catégories & Produits
  const categories = ['Électronique', 'Mode', 'Maison'];
  const categoryIds = [];

  for (const name of categories) {
    const cat = await prisma.category.create({
      data: { name, storeId: store.id },
    });
    categoryIds.push(cat.id);
  }

  const products = [
    { name: 'Smartphone Pro', buy: 400, sell: 1200, cat: categoryIds[0] },
    { name: 'Laptop Air', buy: 800, sell: 1800, cat: categoryIds[0] },
    { name: 'T-shirt Coton', buy: 5, sell: 25, cat: categoryIds[1] },
    { name: 'Jeans Slim', buy: 15, sell: 60, cat: categoryIds[1] },
    { name: 'Chaise Bureau', buy: 50, sell: 150, cat: categoryIds[2] },
  ];

  const dbProducts = [];
  for (const p of products) {
    const dbP = await prisma.product.create({
      data: {
        name: p.name,
        purchasePrice: p.buy,
        sellingPrice: p.sell,
        stockLevel: 100,
        storeId: store.id,
        categoryId: p.cat,
      },
    });
    dbProducts.push(dbP);
  }

  // 5. Campagnes Marketing
  const campaigns = [
    { name: 'Black Friday 2024', channel: 'Google Ads', budget: 1500, start: new Date('2024-11-20'), end: new Date('2024-11-30') },
    { name: 'Soldes Hiver 2025', channel: 'Facebook Ads', budget: 2000, start: new Date('2025-01-01'), end: new Date('2025-01-31') },
    { name: 'Influenceurs Mars', channel: 'Instagram', budget: 1000, start: new Date('2025-03-01'), end: new Date('2025-03-31') },
  ];

  const dbCampaigns = [];
  for (const c of campaigns) {
    const dbC = await prisma.campaign.create({
      data: {
        name: c.name,
        channel: c.channel,
        budget: c.budget,
        startDate: c.start,
        endDate: c.end,
        storeId: store.id,
      },
    });
    dbCampaigns.push(dbC);
  }

  // 6. Clients
  const sources = ['Organic', 'Ads', 'Social'];
  const customers = [];
  for (let i = 0; i < 5; i++) {
    const campaignId = i < 2 ? dbCampaigns[0].id : (i < 4 ? dbCampaigns[1].id : null);
    const c = await prisma.customer.create({
      data: {
        name: `Client ${i}`,
        email: `client${i}@test.com`,
        source: campaignId ? 'Ads' : 'Organic',
        campaignId,
        storeId: store.id,
      },
    });
    customers.push(c);
  }

  // 7. Ventes sur 1 mois pour accélérer
  console.log('💸 Génération des ventes...');
  const now = new Date();
  for (let m = 0; m < 1; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 15);
    
    // Entre 2 et 5 ventes par mois
    const salesCount = Math.floor(Math.random() * 3) + 2;

    for (let s = 0; s < salesCount; s++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const productCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;

      const sale = await prisma.sale.create({
        data: {
          storeId: store.id,
          customerId: customer.id,
          createdAt: monthDate,
          totalAmount: 0, // Mis à jour après
        },
      });

      for (let i = 0; i < productCount; i++) {
        const product = dbProducts[Math.floor(Math.random() * dbProducts.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: qty,
            unitPrice: product.sellingPrice,
            unitCost: product.purchasePrice,
            createdAt: monthDate,
          },
        });
        totalAmount += product.sellingPrice * qty;
      }

      await prisma.sale.update({
        where: { id: sale.id },
        data: { totalAmount },
      });
    }

    // 8. Dépenses fixes par mois
    await prisma.expense.create({
      data: {
        name: 'Loyer Bureau',
        amount: 1500,
        category: 'Fixed',
        date: monthDate,
        storeId: store.id,
      },
    });
    await prisma.expense.create({
      data: {
        name: 'Salaires',
        amount: 3000,
        category: 'Fixed',
        date: monthDate,
        storeId: store.id,
      },
    });
  }

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
