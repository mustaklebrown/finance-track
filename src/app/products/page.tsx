'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, type ProductFormData } from '@/lib/validations/product';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowLeft, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: number;
  sellingPrice: number;
  stockLevel: number;
  lowStockAlert: number;
  isFollowed: boolean;
  status: string;
  category?: { name: string } | null;
  _count?: { saleItems: number };
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema) as Resolver<ProductFormData>,
    defaultValues: {
      name: '',
      sku: '',
      purchasePrice: 0,
      sellingPrice: 0,
      stockLevel: 0,
      lowStockAlert: 5,
      isFollowed: false,
      categoryId: '',
      status: 'ACTIVE'
    }

  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const onSubmit: SubmitHandler<ProductFormData> = async (formData) => {
    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowAddForm(false);
        setEditingProductId(null);
        reset();
        fetchProducts();
      } else {
        const errorData = await res.json();
        console.error('Server errors:', errorData);
        alert('Erreur: ' + (errorData.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const editProduct = (product: Product) => {
    setEditingProductId(product.id);
    reset({
      name: product.name,
      sku: product.sku || '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stockLevel: product.stockLevel,
      lowStockAlert: product.lowStockAlert,
      isFollowed: product.isFollowed,
      categoryId: product.category ? categories.find(c => c.name === product.category?.name)?.id || '' : '',
      status: product.status
    });
    setShowAddForm(true);
  };

  const toggleFollow = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFollowed: !currentStatus })
      });
      if (res.ok) {
        setProducts(products.map(p => p.id === id ? { ...p, isFollowed: !currentStatus } : p));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const adjustStock = async (id: string, newStockLevel: number) => {
    if (newStockLevel < 0) return;
    setProducts(products.map(p => p.id === id ? { ...p, stockLevel: newStockLevel } : p));
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockLevel: newStockLevel })
      });
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              Gestion des Produits
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Ajoutez et suivez la rentabilité de vos articles</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="h-10 w-64 rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          <button 
            onClick={() => {
              setEditingProductId(null);
              reset({
                name: '', sku: '', purchasePrice: 0, sellingPrice: 0, stockLevel: 0, lowStockAlert: 5, isFollowed: false, categoryId: '', status: 'ACTIVE'
              });
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 dark:bg-zinc-50 dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Nouveau Produit
          </button>
        </div>
      </header>

      {/* Stats Cards for context */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Produits</span>
          </div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Marge Moyenne</span>
          </div>
          <div className="text-2xl font-bold">
            {products.length > 0 
              ? `${Math.round(products.reduce((acc, p) => acc + (p.sellingPrice - p.purchasePrice) / p.sellingPrice, 0) / products.length * 100)}%`
              : '0%'
            }
          </div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5 shadow-sm dark:bg-orange-950/10 dark:border-orange-900/20">
          <div className="flex items-center gap-3 text-orange-600 mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Stock Faible</span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {products.filter(p => p.stockLevel <= p.lowStockAlert).length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Produit</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Catégorie</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Coût (Achat)</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Prix (Vente)</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Stock</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Suivi</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-8 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    Aucun produit trouvé. Cliquez sur "Nouveau Produit" pour commencer.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <Link href={`/products/${product.id}`} className="group/link flex flex-col items-start hover:bg-transparent">
                        <span className="font-semibold text-zinc-900 group-hover/link:text-blue-600 transition-colors dark:text-zinc-100 dark:group-hover/link:text-blue-400 flex items-center gap-1.5">
                          {product.name}
                        </span>
                        <span className="text-xs text-zinc-500 mt-0.5">SKU: {product.sku || 'N/A'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {product.category?.name || 'Général'}
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-600 dark:text-zinc-400">
                      {product.purchasePrice.toLocaleString()} KMF
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-600">
                      {product.sellingPrice.toLocaleString()} KMF
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => adjustStock(product.id, product.stockLevel - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        >
                          -
                        </button>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium min-w-14 text-center",
                          product.stockLevel <= product.lowStockAlert 
                            ? 'bg-rose-100 text-rose-700 font-bold' 
                            : 'bg-emerald-100 text-emerald-700'
                        )}>
                          {product.stockLevel} pt
                        </span>
                        <button 
                          onClick={() => adjustStock(product.id, product.stockLevel + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleFollow(product.id, product.isFollowed)}
                        className={cn("transition-all", product.isFollowed ? 'text-blue-600' : 'text-zinc-300 hover:text-zinc-500')}
                        title={product.isFollowed ? "Suivi activé" : "Suivre ce produit"}
                      >
                        {product.isFollowed ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => editProduct(product)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
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

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-xl font-bold">{editingProductId ? 'Modifier le Produit' : 'Nouveau Produit'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.sellingPrice && errors.sellingPrice.type === "custom" && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 text-sm">
                  {errors.sellingPrice.message}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Nom du Produit *</label>
                  <input 
                    {...register('name')}
                    placeholder="ex: MacBook Air M2"
                    className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50 dark:border-zinc-800", errors.name ? "border-rose-500" : "border-zinc-200")}
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Catégorie</label>
                  <select 
                    {...register('categoryId')}
                    className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50 dark:border-zinc-800", errors.categoryId ? "border-rose-500" : "border-zinc-200")}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-rose-500">{errors.categoryId.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Prix d'Achat (HT) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('purchasePrice')}
                    className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50 dark:border-zinc-800", errors.purchasePrice ? "border-rose-500" : "border-zinc-200")}
                  />
                  {errors.purchasePrice && <p className="mt-1 text-xs text-rose-500">{errors.purchasePrice.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Prix de Vente (TTC) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('sellingPrice')}
                    className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50 dark:border-zinc-800", errors.sellingPrice ? "border-rose-500" : "border-zinc-200")}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Stock Initial</label>
                  <input 
                    type="number" 
                    {...register('stockLevel')}
                    className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50 dark:border-zinc-800", errors.stockLevel ? "border-rose-500" : "border-zinc-200")}
                  />
                  {errors.stockLevel && <p className="mt-1 text-xs text-rose-500">{errors.stockLevel.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Alerte Stock</label>
                  <input 
                    type="number" 
                    {...register('lowStockAlert')}
                    className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50 dark:border-zinc-800", errors.lowStockAlert ? "border-rose-500" : "border-zinc-200")}
                  />
                  {errors.lowStockAlert && <p className="mt-1 text-xs text-rose-500">{errors.lowStockAlert.message}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="follow"
                  {...register('isFollowed')}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="follow" className="text-sm text-zinc-600 dark:text-zinc-400 underline decoration-dotted decoration-zinc-300 cursor-help">
                  Suivre automatiquement ce produit
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
