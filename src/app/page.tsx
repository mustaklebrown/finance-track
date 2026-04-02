'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Users, 
  DollarSign, 
  Calendar,
  LayoutDashboard,
  Filter,
  Package,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { cn } from '@/lib/utils';

const formatYAxis = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-500 dark:text-zinc-400 capitalize">{entry.name}</span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {entry.value.toLocaleString()} KMF
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  
  // Nouveaux states pour les KPIs dynamiques
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [prevMonthData, setPrevMonthData] = useState<any>(null);
  
  // New detailed states
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [detailedCategories, setDetailedCategories] = useState<any[]>([]);

  const fetchDashboardData = async (storeId: string) => {
    try {
      setLoading(true);
      // 2. Fetch KPIs (Current Month vs Previous Month for real trends)
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const [kpiResThis, kpiResLast] = await Promise.all([
        fetch(`/api/dashboard/kpis?storeId=${storeId}&startDate=${firstDayThisMonth}&endDate=${lastDayThisMonth}`),
        fetch(`/api/dashboard/kpis?storeId=${storeId}&startDate=${firstDayLastMonth}&endDate=${lastDayLastMonth}`)
      ]);

      const [kpiThis, kpiLast] = await Promise.all([kpiResThis.json(), kpiResLast.json()]);
      
      setData(kpiThis); // fallback for generic data
      setCurrentMonthData(kpiThis);
      setPrevMonthData(kpiLast);

      // 3. Fetch Revenue vs Expenses
      const revRes = await fetch(`/api/dashboard/charts/revenue-expenses?storeId=${storeId}&year=${now.getFullYear()}`);
      const revData = await revRes.json();
      setRevenueData(revData.map((d: any) => ({
        month: d.month,
        Revenus: d.revenue,
        Dépenses: d.expenses,
        'Bénéfice Net': d.revenue - d.expenses
      })));

      // 4. Fetch Category Sales
      const catRes = await fetch(`/api/dashboard/charts/sales-category?storeId=${storeId}`);
      const catData = await catRes.json();
      const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];
      setCategoryData(catData.map((d: any, i: number) => ({
        name: d.category,
        value: d.revenue,
        fill: colors[i % colors.length]
      })));

      // 5. Fetch Store Performance & Detailed Categories
      const perfRes = await fetch(`/api/dashboard/performance?storeId=${storeId}&startDate=${firstDayThisMonth}&endDate=${lastDayThisMonth}`);
      const perfJson = await perfRes.json();
      setPerformanceData(perfJson.performance);
      setDetailedCategories(perfJson.categories);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        // 1. Get default store
        const storeRes = await fetch('/api/stores');
        if (!storeRes.ok) throw new Error('Could not find store');
        const storesData = await storeRes.json();
        
        const storesArray = Array.isArray(storesData) ? storesData : [storesData];
        setAvailableStores(storesArray);
        
        const activeStore = storesArray[0];
        setStore(activeStore);

        const storeId = activeStore?.id;
        if (!storeId) {
            setLoading(false);
            return;
        }
        
        await fetchDashboardData(storeId);
      } catch (error) {
        console.error('Failed to init dashboard:', error);
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const s = availableStores.find(st => st.id === selectedId);
    if (s) {
      setStore(s);
      fetchDashboardData(selectedId);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold">
            <LayoutDashboard className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              {store?.name || 'Finance Hub'}
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Vue d'ensemble de la performance commerciale</p>
        </div>
        
        <div className="flex items-center gap-2">
          {availableStores.length > 1 && (
            <select
              value={store?.id || ''}
              onChange={handleStoreChange}
              className="mr-2 h-9 rounded-lg border border-zinc-200 bg-white/50 px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {availableStores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <Link href="/products" className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-hover hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Package className="h-4 w-4" />
            Produits
          </Link>
          <button className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-hover hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 capitalize">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-black">
            <Filter className="h-4 w-4" />
            Filtres
          </button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Chiffre d'Affaires" 
          value={currentMonthData ? `${currentMonthData.margins.totalRevenue.toLocaleString()} KMF` : '...'} 
          icon={DollarSign} 
          trend={
             currentMonthData && prevMonthData && prevMonthData.margins.totalRevenue > 0
               ? { 
                   value: Math.abs(((currentMonthData.margins.totalRevenue - prevMonthData.margins.totalRevenue) / prevMonthData.margins.totalRevenue) * 100), 
                   isPositive: currentMonthData.margins.totalRevenue >= prevMonthData.margins.totalRevenue 
                 }
               : { value: 0, isPositive: true }
          }
          isLoading={loading}
        />
        <KpiCard 
          title="Marge Nette" 
          value={currentMonthData ? `${currentMonthData.margins.netMargin.toLocaleString()} KMF` : '...'} 
          description={`Taux: ${currentMonthData?.margins.netMarginPercentage.toFixed(1) || 0}%`}
          icon={Activity} 
          trend={
             currentMonthData && prevMonthData && prevMonthData.margins.netMargin !== 0
               ? { 
                   value: Math.abs(((currentMonthData.margins.netMargin - prevMonthData.margins.netMargin) / Math.abs(prevMonthData.margins.netMargin)) * 100), 
                   isPositive: currentMonthData.margins.netMargin >= prevMonthData.margins.netMargin 
                 }
               : { value: 0, isPositive: true }
          }
          isLoading={loading}
        />
        <KpiCard 
          title="Coût d'Acq. Client (CAC)" 
          value={currentMonthData ? `${currentMonthData.cac.cac.toFixed(2)} KMF` : '...'} 
          description={`${currentMonthData?.cac.newCustomersCount || 0} nouveaux clients`}
          icon={Users} 
          trend={
             currentMonthData && prevMonthData && prevMonthData.cac.cac > 0
               ? { 
                   value: Math.abs(((currentMonthData.cac.cac - prevMonthData.cac.cac) / prevMonthData.cac.cac) * 100), 
                   isPositive: currentMonthData.cac.cac <= prevMonthData.cac.cac // For CAC, lower is better (positive trend usually implies improvement, so green if lower)
                 }
               : { value: 0, isPositive: true }
          }
          isLoading={loading}
        />
        <KpiCard 
          title="Customer LTV" 
          value={currentMonthData ? `${currentMonthData.ltv.ltv.toFixed(0)} KMF` : '...'} 
          icon={TrendingUp} 
          trend={
             currentMonthData && prevMonthData && prevMonthData.ltv.ltv > 0
               ? { 
                   value: Math.abs(((currentMonthData.ltv.ltv - prevMonthData.ltv.ltv) / prevMonthData.ltv.ltv) * 100), 
                   isPositive: currentMonthData.ltv.ltv >= prevMonthData.ltv.ltv 
                 }
               : { value: 0, isPositive: true }
          }
          isLoading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Performance Financière</h3>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Revenus
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Bénéfice
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400 dark:bg-red-500" /> Dépenses
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
                tickFormatter={formatYAxis}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="Revenus" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="Bénéfice Net" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBenefice)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="Dépenses" 
                stroke="#f87171" 
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none" 
                animationDuration={1500}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="mb-6 text-lg font-semibold tracking-tight">Répartition par Catégorie</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-400 text-sm">Aucune donnée disponible</div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 font-medium">Performance Brute</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-bold",
                (data?.margins.grossMarginPercentage || 0) > 50 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              )}>
                {data?.margins.grossMarginPercentage.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 font-medium">Bénéfice Net</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">
                {data?.margins.netMargin.toLocaleString() || 0} KMF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Performance & Category Analysis Details */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold tracking-tight">Ventes par Produit (Top 5)</h3>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-500">Ce mois</div>
          </div>
          <div className="space-y-4">
            {performanceData?.topProducts?.length > 0 ? (
              performanceData.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.quantity} unités vendues</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">+{p.revenue.toLocaleString()} KMF</p>
                </div>
              ))
            ) : (
                <p className="py-8 text-center text-sm text-zinc-400">Aucune vente enregistrée ce mois</p>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between text-sm">
             <span className="text-zinc-500 font-medium italic">Panier Moyen:</span>
             <span className="font-bold text-lg text-blue-600">{performanceData?.averageTicket.toLocaleString() || 0} KMF</span>
          </div>
        </div>

        {/* Categories Analysis Table */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="mb-6 text-lg font-semibold tracking-tight">Rentabilité des Catégorie</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-50 dark:border-zinc-800">
                  <th className="pb-3 font-semibold text-zinc-500">Catégorie</th>
                  <th className="pb-3 font-semibold text-zinc-500 text-right">Volume</th>
                  <th className="pb-3 font-semibold text-zinc-500 text-right">Marge %</th>
                  <th className="pb-3 font-semibold text-zinc-500 text-right">Bénéfice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {detailedCategories.length > 0 ? (
                  detailedCategories.map((cat: any) => (
                    <tr key={cat.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">{cat.name}</td>
                      <td className="py-4 text-right text-zinc-500">{cat.quantity} units</td>
                      <td className="py-4 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          cat.marginPercentage > 30 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {cat.marginPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                        {cat.margin.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="py-8 text-center text-zinc-400">Aucune catégorie analysée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
