'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Users, 
  DollarSign, 
  Calendar,
  LayoutDashboard,
  Package,
  Loader2,
  Wallet,
  Banknote,
  Smartphone,
  Building2,
  ArrowDownRight,
  ArrowUpRight
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
  Cell
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
      <div className="overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/80 p-0 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
        <div className="space-y-1 p-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5">
              <div className="flex items-center gap-2.5">
                <div 
                  className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" 
                  style={{ backgroundColor: entry.color || entry.payload.fill || entry.fill }} 
                />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 capitalize">
                  {entry.name}
                </span>
              </div>
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                {entry.value.toLocaleString()} <span className="text-[10px] font-medium text-zinc-400">KMF</span>
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
  
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [prevMonthData, setPrevMonthData] = useState<any>(null);
  
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [detailedCategories, setDetailedCategories] = useState<any[]>([]);
  const [treasuryData, setTreasuryData] = useState<any>(null);

  const [period, setPeriod] = useState<string>('THIS_MONTH');

  const fetchDashboardData = async (storeId: string, customPeriod?: string) => {
    try {
      setLoading(true);
      const activePeriod = customPeriod || period;
      
      const now = new Date();
      let firstDayThisPeriod = now.toISOString();
      let lastDayThisPeriod = now.toISOString();
      let firstDayLastPeriod = now.toISOString();
      let lastDayLastPeriod = now.toISOString();

      if (activePeriod === 'TODAY') {
        firstDayThisPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
        lastDayThisPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        firstDayLastPeriod = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0).toISOString();
        lastDayLastPeriod = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59).toISOString();
      } else if (activePeriod === 'LAST_7_DAYS') {
        const last7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        firstDayThisPeriod = new Date(last7.getFullYear(), last7.getMonth(), last7.getDate(), 0, 0, 0).toISOString();
        lastDayThisPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        
        const last14 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        firstDayLastPeriod = new Date(last14.getFullYear(), last14.getMonth(), last14.getDate(), 0, 0, 0).toISOString();
        lastDayLastPeriod = new Date(last7.getFullYear(), last7.getMonth(), last7.getDate() - 1, 23, 59, 59).toISOString();
      } else if (activePeriod === 'THIS_MONTH') {
        firstDayThisPeriod = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        lastDayThisPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        
        firstDayLastPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        lastDayLastPeriod = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      } else if (activePeriod === 'LAST_MONTH') {
        firstDayThisPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        lastDayThisPeriod = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
        
        firstDayLastPeriod = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
        lastDayLastPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59).toISOString();
      } else if (activePeriod === 'THIS_YEAR') {
        firstDayThisPeriod = new Date(now.getFullYear(), 0, 1).toISOString();
        lastDayThisPeriod = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
        
        firstDayLastPeriod = new Date(now.getFullYear() - 1, 0, 1).toISOString();
        lastDayLastPeriod = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString();
      } else if (activePeriod === 'ALL_TIME') {
        firstDayThisPeriod = new Date(2000, 0, 1).toISOString();
        lastDayThisPeriod = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
        firstDayLastPeriod = firstDayThisPeriod;
        lastDayLastPeriod = lastDayThisPeriod;
      }

      const [kpiResThis, kpiResLast] = await Promise.all([
        fetch(`/api/dashboard/kpis?storeId=${storeId}&startDate=${firstDayThisPeriod}&endDate=${lastDayThisPeriod}`),
        fetch(`/api/dashboard/kpis?storeId=${storeId}&startDate=${firstDayLastPeriod}&endDate=${lastDayLastPeriod}`)
      ]);

      const [kpiThis, kpiLast] = await Promise.all([kpiResThis.json(), kpiResLast.json()]);
      
      setData(kpiThis);
      setCurrentMonthData(kpiThis);
      setPrevMonthData(activePeriod === 'ALL_TIME' ? kpiThis : kpiLast);

      const revRes = await fetch(`/api/dashboard/charts/revenue-expenses?storeId=${storeId}&year=${now.getFullYear()}`);
      const revData = await revRes.json();
      setRevenueData(revData.map((d: any) => ({
        month: d.month,
        Revenus: d.revenu || 0,
        Dépenses: d.depense || 0,
        'Bénéfice Net': (d.revenu || 0) - (d.depense || 0)
      })));

      const catRes = await fetch(`/api/dashboard/charts/sales-category?storeId=${storeId}&startDate=${firstDayThisPeriod}&endDate=${lastDayThisPeriod}`);
      const catData = await catRes.json();
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];
      setCategoryData(catData.map((d: any, i: number) => ({
        name: d.name || 'Inconnu',
        value: d.value || 0,
        fill: colors[i % colors.length]
      })));

      const perfRes = await fetch(`/api/dashboard/performance?storeId=${storeId}&startDate=${firstDayThisPeriod}&endDate=${lastDayThisPeriod}`);
      const perfJson = await perfRes.json();
      setPerformanceData(perfJson.performance);
      setDetailedCategories(perfJson.categories);

      // Fetch treasury data
      const treasuryRes = await fetch(`/api/dashboard/treasury?startDate=${firstDayThisPeriod}&endDate=${lastDayThisPeriod}`);
      if (treasuryRes.ok) {
        const treasuryJson = await treasuryRes.json();
        setTreasuryData(treasuryJson);
      }

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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
              <Calendar className="h-4 w-4" />
            </div>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                if (store?.id) fetchDashboardData(store.id, e.target.value);
              }}
              className="appearance-none h-9 rounded-lg border border-zinc-200 bg-white pl-9 pr-8 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <option value="TODAY">Aujourd'hui</option>
              <option value="LAST_7_DAYS">7 derniers jours</option>
              <option value="THIS_MONTH">Ce mois-ci</option>
              <option value="LAST_MONTH">Mois dernier</option>
              <option value="THIS_YEAR">Cette année</option>
              <option value="ALL_TIME">Tout le temps</option>
            </select>
          </div>
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
                   isPositive: currentMonthData.cac.cac <= prevMonthData.cac.cac
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
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
          
          <div className="relative mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Performance Financière</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Croissance des revenus et évolution des bénéfices</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 bg-zinc-50/50 dark:bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">Revenus</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">Bénéfice</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="h-2 w-2 rounded-full bg-rose-400 dark:bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">Dépenses</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                  tickFormatter={formatYAxis}
                  dx={-10}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Revenus" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2000}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6', className: "shadow-lg shadow-blue-500/50" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Bénéfice Net" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorBenefice)" 
                  animationDuration={2000}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981', className: "shadow-lg shadow-emerald-500/50" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Dépenses" 
                  stroke="#fb7185" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="group rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none">
          <div className="mb-8">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Répartition Ventes</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Source des revenus par catégorie</p>
          </div>
          
          <div className="relative h-[280px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          stroke="transparent"
                          className="outline-none transition-all duration-300 hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Total</span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {categoryData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500">KMF</span>
                </div>
              </>
            ) : (
              <div className="text-zinc-400 text-sm flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full border-4 border-zinc-100 border-t-zinc-200 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Performance Brute</span>
              </div>
              <span className={cn(
                "rounded-lg px-2 py-0.5 text-xs font-black",
                (data?.margins.grossMarginPercentage || 0) > 50 ? "text-emerald-600" : "text-blue-600"
              )}>
                {data?.margins.grossMarginPercentage.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Bénéfice Net</span>
              </div>
              <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                {data?.margins.netMargin.toLocaleString() || 0} <span className="text-[10px] font-medium text-zinc-400">KMF</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury Section */}
      {treasuryData && (
        <div className="mt-8 rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-500" />
                Trésorerie Immédiate
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Solde en temps réel par moyen de paiement — synchronisé avec les décaissements</p>
            </div>
            <div className={cn(
              "rounded-xl px-4 py-2 text-sm font-black",
              treasuryData.totals.balance >= 0 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" 
                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800"
            )}>
              Solde Total: {treasuryData.totals.balance.toLocaleString()} KMF
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Cash */}
            {(() => {
              const cash = treasuryData.byMethod?.CASH || { income: 0, expenses: 0, balance: 0 };
              return (
                <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-emerald-50/50 to-white p-5 dark:border-zinc-800 dark:from-emerald-950/10 dark:to-zinc-900">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Caisse (Espèces)</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-emerald-500" />Entrées</span>
                      <span className="font-bold text-emerald-600">+{cash.income.toLocaleString()} KMF</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-rose-500" />Décaissements</span>
                      <span className="font-bold text-rose-600">-{cash.expenses.toLocaleString()} KMF</span>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between">
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Solde Caisse</span>
                      <span className={cn("text-sm font-black", cash.balance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
                        {cash.balance.toLocaleString()} KMF
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bank */}
            {(() => {
              const bank = treasuryData.byMethod?.BANK || { income: 0, expenses: 0, balance: 0 };
              return (
                <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-blue-50/50 to-white p-5 dark:border-zinc-800 dark:from-blue-950/10 dark:to-zinc-900">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Banque</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-emerald-500" />Entrées</span>
                      <span className="font-bold text-emerald-600">+{bank.income.toLocaleString()} KMF</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-rose-500" />Décaissements</span>
                      <span className="font-bold text-rose-600">-{bank.expenses.toLocaleString()} KMF</span>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between">
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Solde Banque</span>
                      <span className={cn("text-sm font-black", bank.balance >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-700 dark:text-rose-400")}>
                        {bank.balance.toLocaleString()} KMF
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Mobile Money */}
            {(() => {
              const mobile = treasuryData.byMethod?.MOBILE || treasuryData.byMethod?.MOBILE_MONEY || { income: 0, expenses: 0, balance: 0 };
              // Merge both MOBILE and MOBILE_MONEY keys if they both exist
              const mobileAlt = treasuryData.byMethod?.MOBILE_MONEY || { income: 0, expenses: 0, balance: 0 };
              const merged = {
                income: (treasuryData.byMethod?.MOBILE?.income || 0) + (mobileAlt.income || 0),
                expenses: (treasuryData.byMethod?.MOBILE?.expenses || 0) + (mobileAlt.expenses || 0),
                balance: 0
              };
              merged.balance = merged.income - merged.expenses;
              return (
                <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-violet-50/50 to-white p-5 dark:border-zinc-800 dark:from-violet-950/10 dark:to-zinc-900">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Mobile Money</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-emerald-500" />Entrées</span>
                      <span className="font-bold text-emerald-600">+{merged.income.toLocaleString()} KMF</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-rose-500" />Décaissements</span>
                      <span className="font-bold text-rose-600">-{merged.expenses.toLocaleString()} KMF</span>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between">
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Solde Mobile</span>
                      <span className={cn("text-sm font-black", merged.balance >= 0 ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400")}>
                        {merged.balance.toLocaleString()} KMF
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Recent disbursements */}
          {treasuryData.recentDisbursements && treasuryData.recentDisbursements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Derniers décaissements</h4>
              <div className="space-y-2">
                {treasuryData.recentDisbursements.slice(0, 5).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-4 py-2.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{d.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {new Date(d.date).toLocaleDateString('fr-FR')} · 
                          {d.paymentMethod === 'CASH' ? ' Espèces' : d.paymentMethod === 'BANK' ? ' Banque' : ' Mobile Money'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-rose-600">-{d.amount.toLocaleString()} KMF</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Store Performance & Category Analysis Details */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Ventes par Produit</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Les 5 meilleures performances du mois</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 border border-blue-500/20">Ce mois</div>
          </div>
          <div className="space-y-3">
            {performanceData?.topProducts?.length > 0 ? (
              performanceData.topProducts.map((p: any, i: number) => (
                <div key={i} className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:border-zinc-100 hover:bg-zinc-50/50 dark:hover:border-zinc-800 dark:hover:bg-white/5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-black text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                      <p className="text-[11px] font-medium text-zinc-500">{p.quantity} unités vendues</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">+{p.revenue.toLocaleString()} KMF</p>
                    <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (p.revenue / (performanceData.topProducts[0]?.revenue || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="py-12 text-center text-sm text-zinc-400 font-medium">Aucune vente enregistrée ce mois</div>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest italic">Panier Moyen:</span>
             <span className="font-black text-2xl bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">{performanceData?.averageTicket.toLocaleString() || 0} <span className="text-xs text-zinc-400">KMF</span></span>
          </div>
        </div>

        {/* Categories Analysis Table */}
        <div className="rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none">
          <div className="mb-8">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Rentabilité Catégories</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Analyse détaillée des marges sectorielles</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-zinc-400">Catégorie</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-right">Volume</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-right">Marge %</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-right">Bénéfice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {detailedCategories.length > 0 ? (
                  detailedCategories.map((cat: any) => (
                    <tr key={cat.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/5">
                      <td className="py-4 font-bold text-zinc-900 dark:text-zinc-100">{cat.name}</td>
                      <td className="py-4 text-right text-xs font-semibold text-zinc-500">{cat.quantity} unités</td>
                      <td className="py-4 text-right">
                        <span className={cn(
                          "rounded-lg px-2 py-1 text-[10px] font-black tracking-tight",
                          cat.marginPercentage > 30 ? "bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/10" : "bg-blue-500/10 text-blue-600 shadow-sm shadow-blue-500/10"
                        )}>
                          {cat.marginPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono font-black text-zinc-900 dark:text-zinc-50 text-sm">
                        {cat.margin.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="py-12 text-center text-zinc-400 font-medium">Aucune catégorie analysée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
