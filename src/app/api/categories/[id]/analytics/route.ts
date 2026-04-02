import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;

    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    // Products in category
    const products = await prisma.product.findMany({
      where: { categoryId: id },
      include: {
        saleItems: true
      }
    });

    const totalProducts = products.length;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalSold = 0;

    const productPerformances = products.map(product => {
      let revenue = 0;
      let profit = 0;
      let sold = 0;

      product.saleItems.forEach(item => {
        const itemRevenue = item.unitPrice * item.quantity;
        const itemCost = item.unitCost * item.quantity;
        revenue += itemRevenue;
        profit += (itemRevenue - itemCost);
        sold += item.quantity;
      });

      totalRevenue += revenue;
      totalProfit += profit;
      totalSold += sold;

      return {
        id: product.id,
        name: product.name,
        revenue,
        profit,
        sold,
        stockLevel: product.stockLevel
      };
    });

    // Top products by revenue
    const topProducts = [...productPerformances].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Sales over time for this category
    const saleItems = await prisma.saleItem.findMany({
      where: {
        product: {
          categoryId: id
        }
      },
      include: {
        sale: true
      }
    });

    // Group by month
    const currentYear = new Date().getFullYear();
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(currentYear, i).toLocaleString('fr-FR', { month: 'long' }),
      revenu: 0,
      profit: 0
    }));

    saleItems.forEach(item => {
      if (item.sale && item.sale.createdAt.getFullYear() === currentYear) {
        const m = item.sale.createdAt.getMonth();
        const rev = item.unitPrice * item.quantity;
        const prof = rev - (item.unitCost * item.quantity);
        monthsData[m].revenu += rev;
        monthsData[m].profit += prof;
      }
    });

    return NextResponse.json({
      category,
      kpis: {
        totalProducts,
        totalRevenue,
        totalProfit,
        totalSold,
        margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      topProducts,
      monthlyData: monthsData
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
