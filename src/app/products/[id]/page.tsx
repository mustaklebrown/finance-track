'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft,
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle2,
  History,
  ArrowDownIcon as ArrowDown,
  ArrowUpIcon as ArrowUp,
  RefreshCcw,
  Megaphone,
  Target
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
  Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function ProductAnalyticsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [saleForm, setSaleForm] = useState({
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    unitPrice: '',
  });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    channel: 'Facebook',
    budget: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/products/${id}/analytics`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load product analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = {
        quantity: Number(saleForm.quantity),
        date: saleForm.date,
      };
      if (saleForm.unitPrice) body.unitPrice = Number(saleForm.unitPrice);

      const res = await fetch(`/api/products/${id}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowSaleForm(false);
        setSuccessMsg(`✅ Vente enregistrée ! Stock mis à jour.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setLoading(true);
        await fetchData();
        setSaleForm({ quantity: 1, date: new Date().toISOString().split('T')[0], unitPrice: '' });
      } else {
        const err = await res.json();
        alert('Erreur : ' + (err.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignForm,
          budget: Number(campaignForm.budget)
        }),
      });

      if (res.ok) {
        setShowCampaignForm(false);
        setSuccessMsg(`✅ Campagne publicitaire lancée !`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setLoading(true);
        await fetchData();
        setCampaignForm({ name: '', channel: 'Facebook', budget: '', startDate: new Date().toISOString().split('T')[0] });
      } else {
        const err = await res.json();
        alert('Erreur : ' + (err.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-black">
        <p className="animate-pulse text-zinc-500">Génération de l'analyse du produit...</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-black p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Oups ! Une erreur est survenue</h2>
        <p className="text-zinc-500 mb-6">{data.error}</p>
        <Link href="/products" className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black transition-opacity hover:opacity-90">
          Retour aux produits
        </Link>
      </div>
    );
  }

  const { product, weeklyData = [], monthlyData = [], marketing } = data;
  const movements = product?.movements || [];
  const totalSoldThisYear = (monthlyData || []).reduce((acc: number, cur: any) => acc + (cur.quantite || 0), 0);
  const totalRevenueThisYear = (monthlyData || []).reduce((acc: number, cur: any) => acc + (cur.revenu || 0), 0);
  const averageWeeklySales = (weeklyData || []).reduce((acc: number, cur: any) => acc + (cur.quantite || 0), 0) / (weeklyData?.length || 1);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3 text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/products" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              {product?.name}
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">
            {product?.category?.name || 'Catégorie Générale'} • {product?.sku ? `SKU: ${product.sku}` : 'Sans SKU'}
            {' '}• Prix de vente : <span className="font-semibold text-emerald-600">{product?.sellingPrice?.toLocaleString()} KMF</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "rounded-full px-3 py-1 text-sm font-bold border",
            product.stockLevel <= product.lowStockAlert 
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
          )}>
            Stock : {product.stockLevel} unités
          </span>
          <button
            onClick={() => setShowSaleForm(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Saisir une Vente
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
            <Package className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Quantité Vendue (Année)</span>
          </div>
          <div className="text-3xl font-bold dark:text-zinc-50">{totalSoldThisYear} unités</div>
        </div>
        
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Revenu Généré (Année)</span>
          </div>
          <div className="text-3xl font-bold dark:text-zinc-50">{totalRevenueThisYear.toLocaleString()} KMF</div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Moyenne Hebdomadaire</span>
          </div>
          <div className="text-3xl font-bold dark:text-zinc-50">{averageWeeklySales.toFixed(1)} / sem.</div>
        </div>
      </div>

      {/* Low stock warning */}
      {product.stockLevel <= product.lowStockAlert && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/10 dark:border-rose-900/30 p-4 text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Stock Critique !</p>
            <p className="text-xs opacity-80">Il ne reste que {product.stockLevel} unité(s). Le seuil d'alerte est fixé à {product.lowStockAlert}. Pensez à vous réapprovisionner.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Weekly Chart */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold dark:text-zinc-50 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500"/>
                Ventes Hebdomadaires
              </h3>
              <p className="text-sm text-zinc-500">Volumes écoulés sur les 12 dernières semaines</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="quantite" name="Unités vendues" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold dark:text-zinc-50 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Évolution Annuelle (Saisonnalité)
              </h3>
              <p className="text-sm text-zinc-500">Revenus générés par mois sur l'année en cours</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="revenu" 
                  name="Revenu (KMF)"
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSaleForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Saisie de Vente
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{product.name}</span>
              {' '}• Prix catalogue : {product.sellingPrice} KMF
            </p>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Date de la Vente
                </label>
                <input 
                  type="date" 
                  value={saleForm.date}
                  onChange={e => setSaleForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-black/50 dark:border-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Quantité Vendue *
                </label>
                <input 
                  type="number"
                  min={1}
                  max={product.stockLevel}
                  value={saleForm.quantity}
                  onChange={e => setSaleForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-lg font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-black/50 dark:border-zinc-800"
                  required
                />
                <p className="mt-1 text-xs text-zinc-400">Stock disponible : {product.stockLevel} unités</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Prix de Vente Unitaire (KMF) — Optionnel
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder={`Par défaut : ${product.sellingPrice} KMF`}
                  value={saleForm.unitPrice}
                  onChange={e => setSaleForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-black/50 dark:border-zinc-800"
                />
                <p className="mt-1 text-xs text-zinc-400">Laissez vide pour utiliser le prix catalogue.</p>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Total estimé</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {((Number(saleForm.unitPrice) || product.sellingPrice) * saleForm.quantity).toLocaleString()} KMF
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowSaleForm(false)}
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Confirmer la Vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marketing ROI & Acquisition Section */}
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 dark:text-zinc-50">
              <Megaphone className="h-5 w-5 text-indigo-500" />
              Impact Marketing (ROI)
            </h3>
            <p className="text-sm text-zinc-500">Rentabilité publicitaire calculée via la Marge Commerciale générée cette année.</p>
          </div>
          <button
            onClick={() => setShowCampaignForm(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Campagne
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 border-r border-zinc-100 dark:border-zinc-800 pr-6 space-y-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Dépense Totale (Ads)</p>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                -{marketing?.totalSpend?.toLocaleString() || 0} KMF
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Marge Cible Générée</p>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                +{marketing?.margeCommerciale?.toLocaleString() || 0} KMF
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Surplus / Rendement (ROI)</p>
              <div className={cn(
                "text-3xl font-bold",
                (marketing?.roi || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"
              )}>
                {(marketing?.roi || 0).toFixed(1)} %
              </div>
              <p className="text-xs text-zinc-400 mt-1">Sur base du budget alloué ciblant ce produit.</p>
            </div>
          </div>

          <div className="lg:col-span-2 pl-2">
            <h4 className="text-sm font-semibold tracking-tight text-zinc-600 dark:text-zinc-400 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4" /> Campagnes Liées
            </h4>
            <div className="space-y-3">
              {marketing?.campaigns?.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
                  Aucune campagne n'a été spécifiquement liée à ce produit.
                </div>
              ) : (
                marketing?.campaigns?.map((camp: any) => (
                  <div key={camp.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                    <div>
                      <p className="font-semibold text-sm">{camp.name}</p>
                      <p className="text-xs text-zinc-500">{camp.channel} • Démarrée le {new Date(camp.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-rose-600 dark:text-rose-400">-{camp.budget.toLocaleString()} KMF</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement History Section */}
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Historique des Flux de Stock
          </h3>
          <span className="text-xs text-zinc-400 uppercase tracking-widest font-medium">20 Derniers mouvements</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                <th className="px-6 py-3 font-medium text-zinc-500">Date & Heure</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Type</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Quantité</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Raison / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">Aucun mouvement enregistré pour ce produit.</td>
                </tr>
              ) : (
                movements.map((mv: any) => (
                  <tr key={mv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(mv.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        mv.type === 'SALE' ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" :
                        mv.type === 'ADJUSTMENT' ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" :
                        mv.type === 'RESTOCK' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" :
                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {mv.type === 'SALE' && <ArrowDown className="h-3 w-3" />}
                        {mv.type === 'RESTOCK' && <ArrowUp className="h-3 w-3" />}
                        {mv.type === 'ADJUSTMENT' && <RefreshCcw className="h-3 w-3" />}
                        {mv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-mono font-bold text-base",
                        mv.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 italic max-w-xs truncate">
                      {mv.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCampaignForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              Lancer une Campagne
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Associez un budget publicitaire pour tracker son impact sur ce produit (ROI direct).
            </p>
            <form onSubmit={handleCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Nom de la Campagne
                </label>
                <input 
                  type="text" 
                  placeholder="ex: Promos de Noël iPhone"
                  value={campaignForm.name}
                  onChange={e => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Canal d'acquisition
                </label>
                <select 
                  value={campaignForm.channel}
                  onChange={e => setCampaignForm(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                >
                  <option value="Facebook/Instagram">Facebook / Instagram Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Tiktok">Tiktok Ads</option>
                  <option value="Emailing">Emailing / Newsletter</option>
                  <option value="Affichage/Print">Affichage Physique</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Budget Alloué (KMF)
                  </label>
                  <input 
                    type="number"
                    min={0}
                    value={campaignForm.budget}
                    onChange={e => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-lg font-bold text-rose-600 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-400">Cette dépense sera auto-ajoutée au SIG global.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Démarrage
                </label>
                <input 
                  type="date" 
                  value={campaignForm.startDate}
                  onChange={e => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCampaignForm(false)}
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  {submitting ? 'Lancement...' : 'Activer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
