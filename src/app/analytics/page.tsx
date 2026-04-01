'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ArrowLeft,
  Calendar,
  Filter,
  DollarSign,
  ArrowUpRight,
  Target,
  Megaphone
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMarketingRecommendations = () => {
    if (!data?.marketingInsights || data.marketingInsights.length === 0) {
      return (
        <p className="text-xs text-zinc-500 leading-relaxed p-4 border rounded-xl dark:border-zinc-800">
          Aucune donnée marketing disponible. Mettez en place des campagnes de publicité pour voir vos recommandations IA ici.
        </p>
      );
    }
    
    // Check best and worse campaign
    const bestCampaign = data.marketingInsights[0];
    const avgRoi = data.marketingInsights.reduce((a: number, b: any) => a + b.roi, 0) / data.marketingInsights.length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.marketingInsights.map((camp: any, idx: number) => {
          const isBest = idx === 0;
          const isNegative = camp.roi <= 0;
          return (
            <div key={idx} className={cn(
              "p-4 rounded-xl border",
              isBest ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20" : 
              (isNegative ? "bg-rose-50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/20" : "bg-blue-50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/20")
            )}>
              <h4 className={cn(
                "font-bold text-sm mb-1 flex items-center justify-between",
                isBest ? "text-emerald-900 dark:text-emerald-400" : (isNegative ? "text-rose-900 dark:text-rose-400" : "text-blue-900 dark:text-blue-400")
              )}>
                {camp.channel} - {camp.name}
                <span className="text-xs py-0.5 px-2 bg-white/50 rounded-full">{camp.roi > 0 ? '+' : ''}{camp.roi.toFixed(1)}% ROI</span>
              </h4>
              <p className={cn(
                "text-xs leading-relaxed mt-2",
                isBest ? "text-emerald-800/80 dark:text-emerald-400/60" : (isNegative ? "text-rose-800/80 dark:text-rose-400/60" : "text-blue-800/80 dark:text-blue-400/60")
              )}>
                {isBest 
                  ? `Ce canal est votre meilleur atout marketing actuel. Investissez plus de budget ici ! (Revenus générés: ${camp.revenue} KMF)` 
                  : (isNegative 
                      ? `Attention, le canal ${camp.channel} sous-performe. Interrompez cette campagne ou analysez l'audience cible.` 
                      : `Une performance stable mais perfectible. Tentez de réaliser une promotion pour booster l'engagement.`)
                }
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-black">
        <p className="animate-pulse text-zinc-500">Synchronisation des données...</p>
      </div>
    );
  }

  const { revenueVsExpenses, salesByCategory, productPerformance, productsMetadata } = data;
  const totalMoisDernier = revenueVsExpenses[new Date().getMonth()].revenu || 0;
  const depensesMoisDernier = revenueVsExpenses[new Date().getMonth()].depense || 0;
  const profitMoisDernier = totalMoisDernier - depensesMoisDernier;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              Analyses Intelligentes
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Exploration synchronisée de vos indicateurs marketing et de vente</p>
        </div>
      </header>

      {/* Main Analytics Content */}
      <div className="space-y-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <Target className={cn("h-5 w-5", "text-blue-600")} />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Revenus en Cours</p>
            <h3 className="text-2xl font-bold dark:text-zinc-50">{totalMoisDernier.toLocaleString()} KMF</h3>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <DollarSign className={cn("h-5 w-5", "text-emerald-600")} />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Marge Mensuelle</p>
            <h3 className="text-2xl font-bold dark:text-zinc-50">{profitMoisDernier.toLocaleString()} KMF</h3>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <Megaphone className={cn("h-5 w-5", "text-rose-500")} />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-tight">Campagnes Actives</p>
            <h3 className="text-2xl font-bold dark:text-zinc-50">{data.marketingInsights.length} Campagnes</h3>
          </div>
        </div>

        {/* Major Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-zinc-50">Ventes vs Profit (Réel)</h3>
                <p className="text-sm text-zinc-500">Basé sur vos remplissages journaliers</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="revenu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="depense" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} className="dark:fill-zinc-700" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-zinc-50">Tendance Réelle de Croissance</h3>
                <p className="text-sm text-zinc-500">Marge brute sur l'année</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="revenu" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performances des Produits par Mois */}
        {productsMetadata && productsMetadata.length > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-zinc-50">Quantité de Ventes par Produit (Réel)</h3>
                <p className="text-sm text-zinc-500">Analyse issue des tickets de caisse</p>
              </div>
            </div>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  {productsMetadata.map((product: any) => (
                    <Line 
                      key={product.name}
                      type="monotone" 
                      dataKey={product.name} 
                      name={product.name}
                      stroke={product.color} 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recommendations Marketing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-semibold mb-6 dark:text-zinc-50">Répartition par Catégorie</h3>
            <div className="space-y-4">
              {salesByCategory.length === 0 ? <p className="text-xs text-zinc-500">Aucune donnée</p> : null}
              {salesByCategory.map((cat: any, i: number) => {
                const max = Math.max(...salesByCategory.map((c: any) => c.value));
                const percentage = max > 0 ? (cat.value / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{cat.name}</span>
                      <span className="font-bold">{cat.value.toLocaleString()} KMF</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: cat.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-semibold mb-2 dark:text-zinc-50 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-500" /> Recommandations Marketing IA
            </h3>
            <p className="text-sm text-zinc-500 mb-6">Basé sur le calcul du ROI de vos campagnes réelles</p>
            {getMarketingRecommendations()}
          </div>
        </div>
      </div>
    </div>
  );
}
