'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
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
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  PieChart as PieChartIcon, 
  ArrowLeft,
  Briefcase,
  History,
  ShieldCheck,
  Plus,
  Loader2,
  Calendar,
  Building2,
  Wallet,
  Trash2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AccountingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entryForm, setEntryForm] = useState({
    type: 'ASSET',
    category: 'CASH',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categoriesByType: Record<string, { value: string, label: string }[]> = {
    ASSET: [
      { value: 'CASH', label: 'Caisse / Espèces' },
      { value: 'BANK', label: 'Compte Bancaire' },
      { value: 'RECEIVABLE', label: 'Créances Clients' },
      { value: 'EQUIPMENT', label: 'Matériel / Équipement' }
    ],
    LIABILITY: [
      { value: 'LOAN', label: 'Emprunt Bancaire' },
      { value: 'TAX_DEBT', label: 'Dettes Fiscales & Sociales' },
      { value: 'SUPPLIER_DEBT', label: 'Dettes Fournisseurs Diverses' }
    ],
    EQUITY: [
      { value: 'CAPITAL', label: 'Capital Social / Apport initial' },
      { value: 'CURRENT_ACCOUNT', label: "Compte Courant d'Associé" },
      { value: 'RETAINED_EARNINGS', label: 'Réserves / Report à nouveau' }
    ]
  };

  const currentCategories = categoriesByType[entryForm.type] || categoriesByType['ASSET'];

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entryForm,
          amount: Number(entryForm.amount)
        })
      });

      if (res.ok) {
        setShowEntryForm(false);
        setEntryForm({ type: 'ASSET', category: 'CASH', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
        fetchAccountingData();
      } else {
        const err = await res.json();
        alert('Erreur: ' + (err.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-zinc-50 dark:bg-black h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const { balanceSheet, sig, records = [] } = data || {};

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne comptable ? Cela recalculera votre Bilan.')) return;
    try {
      const res = await fetch(`/api/accounting/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAccountingData();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const balanceData = [
    { name: 'Actifs', value: balanceSheet?.assets.total, fill: '#10b981' },
    { name: 'Passifs', value: balanceSheet?.liabilities.total, fill: '#f43f5e' },
    { name: 'Capitaux Propres', value: balanceSheet?.equity.total, fill: '#8b5cf6' }
  ];

  const sigData = [
    { name: 'COGS', value: sig?.achatConsommes, fill: '#f43f5e' },
    { name: 'Bénéfice Net (EBE)', value: sig?.ebe, fill: '#10b981' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
               Comptabilité & SIG
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Soldes Intermédiaires de Gestion & Analyse du Bilan</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEntryForm(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Écriture
          </button>
        </div>
      </header>

      {/* Ratios & Key KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Solvabilité Globale</span>
          </div>
          <div className="text-3xl font-bold dark:text-zinc-50">
            {balanceSheet?.ratios.solvency.toFixed(1)} %
          </div>
          <p className="mt-1 text-xs text-zinc-400">Ratio Actifs / Passifs (Cible {'>'} 100%)</p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Autonomie Financière</span>
          </div>
          <div className="text-3xl font-bold dark:text-zinc-50">
            {balanceSheet?.ratios.autonomy.toFixed(1)} %
          </div>
          <p className="mt-1 text-xs text-zinc-400">Part de Capital Propre dans le Bilan</p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Valeur Ajoutée (VA)</span>
          </div>
          <div className="text-3xl font-bold dark:text-zinc-50">
            {sig?.valeurAjoutee?.toLocaleString()} KMF
          </div>
          <p className="mt-1 text-xs text-zinc-400">Richesse brute générée sur la période</p>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Balance Sheet Visualization */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-blue-500" />
                Structure du Bilan (Solvabilité)
              </h3>
              <p className="text-sm text-zinc-500">Répartition Actifs vs Passifs & Capitaux</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={balanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {balanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 space-y-4">
             <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-1.5">
                   <span className="text-sm font-medium text-zinc-500">Valeur Totale des Stocks</span>
                   <div className="group relative">
                     <Info className="h-4 w-4 text-zinc-400 cursor-help" />
                     <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-2 rounded-lg z-10 text-center shadow-xl">
                       Éditée et calculée automatiquement via la page Produits.
                     </div>
                   </div>
                </div>
                <span className="font-bold">{balanceSheet?.assets.stock.toLocaleString()} KMF</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-sm font-medium text-zinc-500">Trésorerie Immédiate</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{balanceSheet?.assets.financial.toLocaleString()} KMF</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-sm font-medium text-zinc-500">Dettes Fournisseurs</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{balanceSheet?.liabilities.supplierDebts.toLocaleString()} KMF</span>
             </div>
          </div>
        </div>

        {/* SIG Details (EBE, VA, etc.) */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
           <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Performance d'Exploitation (SIG)
                </h3>
                <p className="text-sm text-zinc-500">Du Chiffre d'Affaires au Résultat Net</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm mb-1 px-1">
                    <span className="text-zinc-500">Chiffre d'Affaires</span>
                    <span className="font-bold">{sig?.chiffreAffaires.toLocaleString()} KMF</span>
                 </div>
                 <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: '100%' }} />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm mb-1 px-1">
                    <span className="text-zinc-500">Marge Commerciale</span>
                    <span className="font-bold text-blue-600">{sig?.margeBrute?.toLocaleString()} KMF</span>
                 </div>
                 <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(sig?.margeBrute / (sig?.chiffreAffaires || 1)) * 100}%` }} 
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm mb-1 px-1">
                    <span className="text-zinc-500">Valeur Ajoutée (VA)</span>
                    <span className="font-bold text-amber-600">{sig?.valeurAjoutee?.toLocaleString()} KMF</span>
                 </div>
                 <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${(sig?.valeurAjoutee / (sig?.chiffreAffaires || 1)) * 100}%` }} 
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm mb-1 px-1">
                    <span className="text-zinc-500">EBITDA / EBE</span>
                    <span className="font-bold text-emerald-600">{sig?.ebe.toLocaleString()} KMF</span>
                 </div>
                 <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(sig?.ebe / (sig?.chiffreAffaires || 1)) * 100}%` }} 
                    />
                 </div>
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                 <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-4">Analyse de Rentabilité</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-xs text-zinc-500">Rendement sur Actifs (ROA)</p>
                       <p className="text-xl font-bold dark:text-zinc-50">
                         {((sig?.ebe / (balanceSheet?.assets.total || 1)) * 100).toFixed(1)} %
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs text-zinc-500">Rendement sur Fonds Propres (ROE)</p>
                       <p className="text-xl font-bold dark:text-zinc-50">
                         {((sig?.resultatNet / (balanceSheet?.equity.total || 1)) * 100).toFixed(1)} %
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Manual Entries History */}
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Historique des Saisies Manuelles
          </h3>
          <span className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Pour correction d'erreurs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                <th className="px-6 py-3 font-medium text-zinc-500">Date de l'opération</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Type</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Catégorie</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Note</th>
                <th className="px-6 py-3 font-medium text-zinc-500 text-right">Montant</th>
                <th className="px-6 py-3 font-medium text-zinc-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Aucune saisie manuelle pour ce mois.</td>
                </tr>
              ) : (
                records.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(rec.date || rec.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        rec.type === 'ASSET' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" :
                        rec.type === 'EQUITY' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400" :
                        "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                      )}>
                        {rec.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-800 dark:text-zinc-200 font-medium">
                      {categoriesByType[rec.type]?.find(c => c.value === rec.category)?.label || rec.category}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 italic max-w-xs truncate">
                      {rec.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-base">
                      {rec.amount.toLocaleString()} KMF
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title="Supprimer cette ligne en cas d'erreur"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEntryForm(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Saisir Actifs / Passifs / Capital
            </h2>
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Type de compte</label>
                  <select 
                    value={entryForm.type}
                    onChange={e => {
                      const newType = e.target.value;
                      setEntryForm(prev => ({ 
                        ...prev, 
                        type: newType, 
                        category: categoriesByType[newType][0].value 
                      }));
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                  >
                    <option value="ASSET">ACTIF (Possessions de l'entreprise)</option>
                    <option value="LIABILITY">PASSIF (Dettes de l'entreprise)</option>
                    <option value="EQUITY">CAPITAUX PROPRES (Fonds des associés)</option>
                  </select>
                  <p className="mt-1.5 text-[10px] text-zinc-400">Le type détermine de quel côté du bilan ira ce montant.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Sous-catégorie comptable</label>
                  <select 
                    value={entryForm.category}
                    onChange={e => setEntryForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                  >
                    {currentCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Montant (KMF) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <DollarSign className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input 
                    type="number"
                    value={entryForm.amount}
                    onChange={e => setEntryForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Montant total de cet item"
                    className="w-full pl-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-lg font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Note (Optionnel)</label>
                <textarea 
                  value={entryForm.notes}
                  onChange={e => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ex: Apport en capital, Solde compte BNC..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-black/50 dark:border-zinc-800 h-20"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
