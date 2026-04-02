'use client';

import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  ArrowLeft,
  TrendingUp,
  Package,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Edit2,
  Calendar,
  Printer,
  Send,
  MessageCircle,
  Share2,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  purchasePrice: number;
  stockLevel: number;
  category?: { name: string } | null;
}

interface SaleEntry {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  totalAmount: number;
  amountGiven?: number;
  changeReturned?: number;
  createdAt: string;
  items?: Array<{ product: { name: string }; quantity: number; unitPrice: number }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [amountGiven, setAmountGiven] = useState<number | ''>('');
  
  // Invoice state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const deleteSale = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette vente ? Le stock sera automatiquement restauré pour les produits concernés.')) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSales(sales.filter(s => s.id !== id));
        fetchProducts(); // Refresh stock in UI
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (Array.isArray(data)) setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addProduct = (product: Product) => {
    // If already in list, increment qty
    const existing = entries.find(e => e.productId === product.id);
    if (existing) {
      setEntries(entries.map(e =>
        e.productId === product.id ? { ...e, quantity: e.quantity + 1 } : e
      ));
    } else {
      setEntries([...entries, {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.sellingPrice
      }]);
    }
    setProductSearch('');
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setEntries(entries.filter(e => e.productId !== productId));
    } else {
      setEntries(entries.map(e => e.productId === productId ? { ...e, quantity: qty } : e));
    }
  };

  const updatePrice = (productId: string, price: number) => {
    setEntries(entries.map(e => e.productId === productId ? { ...e, unitPrice: price } : e));
  };

  const removeEntry = (productId: string) => {
    setEntries(entries.filter(e => e.productId !== productId));
  };

  const totalAmount = entries.reduce((acc, e) => acc + e.quantity * e.unitPrice, 0);
  const changeReturned = typeof amountGiven === 'number' && amountGiven >= totalAmount ? amountGiven - totalAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0) { alert('Ajoutez au moins un produit.'); return; }
    if (typeof amountGiven !== 'number' || amountGiven < totalAmount) {
      alert('Le montant donné est inférieur au total à encaisser.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        totalAmount,
        amountGiven,
        changeReturned,
        date: saleDate,
        items: entries.map(e => ({
          productId: e.productId,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          unitCost: e.product.purchasePrice
        }))
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.full || errData.error || 'Échec de la création');
      }
      
      const newSale = await res.json();

      setSuccessMsg(`✅ Vente du ${new Date(saleDate).toLocaleDateString('fr-FR')} enregistrée !`);
      setTimeout(() => setSuccessMsg(''), 5000);
      
      // Setup invoice
      setInvoiceData({ ...newSale, entries: [...entries], amountGiven, changeReturned });
      setShowInvoice(true);

      setShowForm(false);
      setEntries([]);
      setAmountGiven('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      fetchSales();
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDate = async (id: string, newDate: string) => {
    try {
      await fetch(`/api/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdAt: newDate })
      });
      fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !entries.find(e => e.productId === p.id)
  );

  const totalMonthRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3 text-sm font-medium shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              Ventes Journalières
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Saisissez les ventes de chaque produit par journée</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Saisir les Ventes du Jour
        </button>
      </header>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Enregistré (Mois)</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            {totalMonthRevenue.toLocaleString()} KMF
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <Banknote className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Transactions Enregistrées</span>
          </div>
          <div className="text-2xl font-bold">{sales.length}</div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Historique des Ventes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Date</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Produits</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Total</th>
                <th className="px-6 py-4 text-right sticky right-0 z-10 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800 ml-auto" /></td>
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                    Aucune vente enregistrée. Cliquez sur "Saisir les Ventes du Jour".
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="group transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {sale.items && sale.items.length > 0
                        ? sale.items.map(item => `${item.product?.name} ×${item.quantity}`).join(', ')
                        : '—'
                      }
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      + {sale.totalAmount.toLocaleString()} KMF
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs transition-colors group-hover:bg-emerald-50/90 dark:group-hover:bg-emerald-950/90 border-l border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setInvoiceData(sale);
                            setShowInvoice(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950"
                          title="Imprimer la facture"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteSale(sale.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                          title="Supprimer la vente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Product Sale Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Form Header */}
            <div className="px-8 pt-8 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Saisie des Ventes par Produit
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Ajoutez chaque produit vendu et sa quantité</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-4 space-y-5">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Date des Ventes
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-black/50 dark:border-zinc-800"
                    required
                  />
                </div>

                {/* Product Search */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Ajouter un Produit
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-black/50 dark:border-zinc-800"
                    />
                    {productSearch && filteredProducts.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-xl overflow-hidden">
                        {filteredProducts.slice(0, 6).map(product => (
                          <button
                            type="button"
                            key={product.id}
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-zinc-400" />
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-zinc-400">{product.category?.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              <span className="text-emerald-600 font-mono font-semibold">{product.sellingPrice} KMF</span>
                              <ChevronRight className="h-4 w-4 text-zinc-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Entries List */}
                {entries.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Produits Sélectionnés</p>
                    {entries.map(entry => (
                      <div key={entry.productId} className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{entry.product.name}</p>
                          <p className="text-xs text-zinc-500">{entry.product.category?.name || 'Général'}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(entry.productId, entry.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 transition"
                          >-</button>
                          <input
                            type="number"
                            min={1}
                            max={entry.product.stockLevel}
                            value={entry.quantity}
                            onChange={e => updateQty(entry.productId, Number(e.target.value))}
                            className="w-14 text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 text-sm font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(entry.productId, entry.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 transition"
                          >+</button>
                        </div>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={entry.unitPrice}
                            onChange={e => updatePrice(entry.productId, Number(e.target.value))}
                            className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-sm font-semibold text-right text-emerald-600 outline-none"
                          />
                          <span className="text-xs text-zinc-400">KMF</span>
                        </div>

                        <div className="text-right min-w-16">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {(entry.quantity * entry.unitPrice).toLocaleString()} KMF
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEntry(entry.productId)}
                          className="text-zinc-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
                    <Package className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Recherchez et ajoutez des produits ci-dessus</p>
                  </div>
                )}
              </div>

              {/* Footer with total and actions */}
              <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 rounded-b-3xl">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col justify-end">
                    <p className="text-sm text-zinc-500">{entries.length} produit(s) • {entries.reduce((acc, e) => acc + e.quantity, 0)} unites</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-2">Total à encaisser</p>
                    <p className="text-2xl font-bold text-emerald-600">{totalAmount.toLocaleString()} KMF</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Montant Donné (KMF)</label>
                      <input
                        type="number"
                        min={totalAmount}
                        value={amountGiven}
                        onChange={e => setAmountGiven(e.target.value ? Number(e.target.value) : '')}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-black/50 dark:border-zinc-800"
                        required
                        placeholder="Ex: 10000"
                      />
                    </div>
                    {typeof amountGiven === 'number' && amountGiven >= totalAmount && (
                      <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                        <span className="text-sm font-semibold">Montant à rendre :</span>
                        <span className="text-lg font-bold text-emerald-600">{changeReturned.toLocaleString()} KMF</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || entries.length === 0}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Enregistrement...' : `Valider ${entries.length > 0 ? `(${totalAmount.toLocaleString()} KMF)` : ''}`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-100 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white text-black p-8 rounded-2xl shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 my-auto">
            
            {/* The printable/PDF area */}
            <div id="invoice-content" className="bg-white p-2">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">FACTURE</h2>
                <p className="text-sm text-zinc-500">{new Date(invoiceData.createdAt || saleDate).toLocaleString('fr-FR')}</p>
                <p className="text-sm text-zinc-500">Ticket #{invoiceData.id?.slice(0, 8).toUpperCase()}</p>
              </div>
            
            <div className="border-t border-b border-zinc-200 py-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left pb-2">Qte x Produit</th>
                    <th className="text-right pb-2">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.entries?.map((entry: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2">
                        {entry.quantity}x {entry.product?.name}
                      </td>
                      <td className="text-right py-2">
                        {(entry.quantity * entry.unitPrice).toLocaleString()} KMF
                      </td>
                    </tr>
                  ))}
                  {(!invoiceData.entries && invoiceData.items) && invoiceData.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2">
                        {item.quantity}x {item.product?.name}
                      </td>
                      <td className="text-right py-2">
                        {(item.quantity * item.unitPrice).toLocaleString()} KMF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>TOTAL A PAYER</span>
                <span>{invoiceData.totalAmount.toLocaleString()} KMF</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Espèces données</span>
                <span>{invoiceData.amountGiven?.toLocaleString() || '0'} KMF</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Monnaie rendue</span>
                <span>{invoiceData.changeReturned?.toLocaleString() || '0'} KMF</span>
              </div>
            </div>
            
            <div className="mt-8 text-center text-xs text-zinc-500 border-t border-zinc-200 pt-4">
              <p>Merci de votre visite et à bientôt !</p>
            </div>
            </div>

            {/* Social Share Buttons */}
            <div className="mt-6 flex flex-col gap-2 print:hidden border-t border-zinc-100 pt-4" data-html2canvas-ignore="true">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest text-center mb-3">Partager & Envoyer</p>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => {
                    try {
                      const idText = (invoiceData.id || '').slice(0, 8).toUpperCase();
                      const itemsArr = invoiceData.entries || invoiceData.items || [];
                      const details = itemsArr.map((item: any) => `- ${item.quantity}x ${item.product?.name || 'Produit'}: ${(item.quantity * (item.unitPrice || item.price || 0)).toLocaleString()} KMF`).join('\n');
                      const dateText = new Date(invoiceData.createdAt || saleDate).toLocaleDateString('fr-FR');
                      const totalFormatted = (invoiceData.totalAmount || 0).toLocaleString();
                      
                      const text = encodeURIComponent(`🔖 *FACTURE*\nDate: ${dateText}\nTicket: #${idText}\n\n*Détails:*\n${details}\n\n*TOTAL: ${totalFormatted} KMF*\n\nMerci de votre confiance !`);
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                    } catch (e) { console.error('WA err', e); }
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-50 hover:bg-emerald-50 text-zinc-500 hover:text-emerald-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Texte WA</span>
                </button>
                <button 
                  onClick={() => {
                    try {
                      const idText = (invoiceData.id || '').slice(0, 8).toUpperCase();
                      const totalFormatted = (invoiceData.totalAmount || 0).toLocaleString();
                      const text = encodeURIComponent(`🔖 *FACTURE*\nTicket: #${idText}\nTotal: ${totalFormatted} KMF`);
                      window.open(`https://t.me/share/url?url=${window.location.origin}&text=${text}`, '_blank');
                    } catch (e) { console.error('TG err', e); }
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-50 hover:bg-blue-50 text-zinc-500 hover:text-blue-500 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Telegram</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const btn = document.getElementById('pdf-btn-icon');
                      if (btn) btn.classList.add('animate-pulse');

                      const { domToJpeg } = await import('modern-screenshot');
                      const { jsPDF } = await import('jspdf');
                      
                      const element = document.getElementById('invoice-content');
                      if (!element) return;
                      
                      const idText = (invoiceData.id || '').slice(0, 8).toUpperCase();
                      const filename = `Facture_${idText}.pdf`;

                      // Convert the DOM to an image representing the invoice to prevent html2canvas color function crashes
                      domToJpeg(element, { 
                        scale: 2, 
                        backgroundColor: '#ffffff',
                        filter: (node) => !node.hasAttribute?.('data-html2canvas-ignore')
                      }).then((dataUrl) => {
                        const pdf = new jsPDF({
                          unit: 'mm',
                          format: 'a5',
                          orientation: 'portrait'
                        });
                        
                        // Dimensions setup
                        const imgProps = pdf.getImageProperties(dataUrl);
                        const pdfWidth = 138;
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                        
                        pdf.addImage(dataUrl, 'JPEG', 5, 5, pdfWidth, pdfHeight);
                        const pdfBlob = pdf.output('blob');
                        
                        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          navigator.share({
                            title: filename,
                            text: 'Voici votre facture en format PDF 🧾.',
                            files: [file],
                          }).catch((err) => {
                             console.error('Share rejected', err);
                             pdf.save(filename);
                          });
                        } else {
                          // Fallback: download locally if share violates scope
                          pdf.save(filename);
                        }
                      });
                    } catch (error) {
                      console.error('Failed to generate PDF', error);
                      alert('Erreur lors de la génération PDF. Veuillez réessayer.');
                    } finally {
                      setTimeout(() => {
                        const btn = document.getElementById('pdf-btn-icon');
                        if (btn) btn.classList.remove('animate-pulse');
                      }, 2000);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-50 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 transition-colors"
                >
                  <FileText id="pdf-btn-icon" className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Envoyer PDF</span>
                </button>
                <button 
                  onClick={() => {
                    try {
                      const idText = (invoiceData.id || '').slice(0, 8).toUpperCase();
                      if (navigator.share) {
                        navigator.share({
                          title: `Facture #${idText}`,
                          text: `Total: ${(invoiceData.totalAmount || 0).toLocaleString()} KMF`,
                          url: window.location.href
                        }).catch(console.error);
                      } else {
                        alert('Le partage natif n\'est pas supporté sur ce navigateur.');
                      }
                    } catch (e) { console.error('Share err', e); }
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Plus</span>
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3 print:hidden" data-html2canvas-ignore="true">
              <button 
                onClick={() => setShowInvoice(false)}
                className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 text-black"
              >
                Fermer
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800"
              >
                <Printer className="w-4 h-4" />
                Imprimer le Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
