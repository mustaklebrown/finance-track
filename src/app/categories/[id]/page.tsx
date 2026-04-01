'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';

export default function CategoryAnalyticsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchCategoryData = async () => {
      try {
        const res = await fetch(`/api/categories/${id}/analytics`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to load category analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryData();
  }, [id]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="animate-pulse text-zinc-500">Chargement des analyses...</p>
      </div>
    );
  }

  const { category, kpis, topProducts, monthlyData } = data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/categories" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              Analyse: {category.name}
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Performances et KPIs de la catégorie de produits</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Revenus Totaux</p>
          <h3 className="text-2xl font-bold dark:text-zinc-50">{kpis.totalRevenue.toLocaleString()} KMF</h3>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Profit Rélisé</p>
          <h3 className="text-2xl font-bold dark:text-zinc-50">{kpis.totalProfit.toLocaleString()} KMF</h3>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Marge Moyenne</p>
          <h3 className="text-2xl font-bold dark:text-zinc-50">{kpis.margin.toFixed(1)} %</h3>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Articles Vendus</p>
          <h3 className="text-2xl font-bold dark:text-zinc-50">{kpis.totalSold} unités</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Charts */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold dark:text-zinc-50">Évolution du Revenu & Profit</h3>
              <p className="text-sm text-zinc-500">Données mensuelles sur l'année en cours</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="revenu" name="Revenu (KMF)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="profit" name="Profit (KMF)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold dark:text-zinc-50">Top Produits</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-4">Les mieux vendus de cette catégorie</p>
          
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">Aucune vente pour le moment.</p>
            ) : null}
            {topProducts.map((product: any, idx: number) => (
              <div key={product.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold dark:text-zinc-200">{product.name}</h4>
                    <span className="text-xs text-zinc-500">{product.sold} vendus • Stock: {product.stockLevel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{product.revenue.toLocaleString()} KMF</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
