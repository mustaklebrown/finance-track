import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';
import { ChartService } from '@/services/chart.service';

export async function GET() {
  try {
    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const storeId = store.id;
    const year = new Date().getFullYear();

    // 1. Revenue vs Expenses
    const revenueVsExpenses = await ChartService.getRevenueVsExpensesByMonth(storeId, year);

    // 2. Sales by Category
    const salesByCategory = await ChartService.getSalesByCategory(storeId, new Date(`${year}-01-01`), new Date(`${year}-12-31`));

    // 3. Marketing Insights (ROI per campaign)
    const campaigns = await prisma.campaign.findMany({
      where: { storeId },
      include: {
        customers: {
          include: { sales: true }
        }
      }
    });

    const marketingInsights = campaigns.map(camp => {
      const totalRevenueFromCampaign = camp.customers.reduce((acc, customer) => {
        return acc + customer.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      }, 0);
      
      const roi = camp.budget > 0 ? ((totalRevenueFromCampaign - camp.budget) / camp.budget) * 100 : 0;
      
      return {
        name: camp.name,
        channel: camp.channel,
        budget: camp.budget,
        revenue: totalRevenueFromCampaign,
        roi
      };
    }).sort((a, b) => b.roi - a.roi);

    // 4. Product performance (Real product sales over months)
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { storeId, createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`), lte: new Date(`${year}-12-31T23:59:59Z`) } } },
      include: { product: true, sale: true }
    });

    const productMonths = Array.from({ length: 12 }, (_, i) => {
      const obj: any = { month: new Date(0, i).toLocaleString('fr-FR', { month: 'short' }) };
      return obj;
    });

    saleItems.forEach(item => {
      const m = item.sale.createdAt.getMonth();
      const pName = item.product.name;
      if (!productMonths[m][pName]) productMonths[m][pName] = 0;
      productMonths[m][pName] += item.quantity; // Tracking sold quantity
    });

    // Ensure all products appear in all months even if 0
    const soldProductNames = Array.from(new Set(saleItems.map(item => item.product.name)));
    productMonths.forEach(m => {
      soldProductNames.forEach(name => {
        if (m[name] === undefined) m[name] = 0;
      });
    });

    const productColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f43f5e', '#06b6d4'];
    const productsMetadata = soldProductNames.map((name, i) => ({
      name, color: productColors[i % productColors.length]
    }));

    return NextResponse.json({
      revenueVsExpenses,
      salesByCategory,
      marketingInsights,
      productPerformance: productMonths,
      productsMetadata
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
