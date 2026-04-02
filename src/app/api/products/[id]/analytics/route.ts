import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthorizedStoreId } from '@/lib/permissions';

function getWeekNumber(date: Date) {
  const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = dCopy.getUTCDay() || 7;
  dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(), 0, 1));
  return Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const storeId_auth = await getAuthorizedStoreId(undefined /* fixed TS */);
    const store = await prisma.store.findUnique({ where: { id: storeId_auth } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    
    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        campaigns: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const saleItems = await prisma.saleItem.findMany({
      where: { productId, sale: { storeId: store.id } },
      include: { sale: true }
    });

    const year = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('fr-FR', { month: 'short' }),
      quantite: 0,
      revenu: 0
    }));

    const weeklyDataMap = new Map<string, { label: string; quantite: number; revenu: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7));
      const weekNum = getWeekNumber(d);
      const label = `S${weekNum}`;
      weeklyDataMap.set(label, { label, quantite: 0, revenu: 0 }); // Preserve insertion order
    }

    let totalRevenueYear = 0;
    let totalCogsYear = 0;

    saleItems.forEach(item => {
      const date = item.sale.createdAt;
      const revenue = item.quantity * item.unitPrice;
      const cogs = item.quantity * item.unitCost;
      
      // Monthly
      if (date.getFullYear() === year) {
        const m = date.getMonth();
        monthlyData[m].quantite += item.quantity;
        monthlyData[m].revenu += revenue;
        totalRevenueYear += revenue;
        totalCogsYear += cogs;
      }

      // Weekly
      const wLabel = `S${getWeekNumber(date)}`;
      if (weeklyDataMap.has(wLabel)) {
        const wData = weeklyDataMap.get(wLabel)!;
        wData.quantite += item.quantity;
        wData.revenu += revenue;
      }
    });

    const weeklyData = Array.from(weeklyDataMap.values());

    // Marketing ROI Calculations
    const totalMarketingSpend = product.campaigns.reduce((acc: number, c: any) => acc + c.budget, 0);
    const margeCommercialeYear = totalRevenueYear - totalCogsYear;
    let marketingRoi = 0;
    if (totalMarketingSpend > 0) {
      marketingRoi = ((margeCommercialeYear - totalMarketingSpend) / totalMarketingSpend) * 100;
    }

    return NextResponse.json({
      product,
      weeklyData,
      monthlyData,
      marketing: {
        totalSpend: totalMarketingSpend,
        margeCommerciale: margeCommercialeYear,
        roi: marketingRoi,
        campaigns: product.campaigns
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
