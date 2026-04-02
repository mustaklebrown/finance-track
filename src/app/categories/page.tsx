'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategorySchema, type CategoryFormData } from '@/lib/validations/category';
import { 
  Tags, 
  Plus, 
  Trash2, 
  Edit2, 
  Search,
  ArrowLeft,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CategoryItem {
  id: string;
  name: string;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(CategorySchema)
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/categories/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          setShowForm(false);
          setEditingId(null);
          reset();
          fetchCategories();
        }
      } else {
        // Create
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          setShowForm(false);
          reset();
          fetchCategories();
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setValue('name', cat.name);
    setShowForm(true);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ? Les produits perdront cette affectation.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
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
              Gestion des Catégories
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Organisez votre catalogue de produits</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="h-10 w-64 rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          <button 
            onClick={() => {
              reset();
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 dark:bg-zinc-50 dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Catégorie
          </button>
        </div>
      </header>

      {/* Stats Card */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <Tags className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Catégories</span>
          </div>
          <div className="text-2xl font-bold">{categories.length}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Nom</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Produits Associés</th>
                <th className="px-6 py-4 text-right sticky right-0 z-10 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                    Aucune catégorie trouvée.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {cat._count?.products || 0} produits
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs transition-colors group-hover:bg-zinc-50/90 dark:group-hover:bg-zinc-800/90 border-l border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/categories/${cat.id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Analyse KPIs"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteCategory(cat.id)}
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

      {/* Zod + React Hook Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="mb-6 text-xl font-bold">{editingId ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Nom de la Catégorie</label>
                <input 
                  {...register('name')}
                  placeholder="ex: Électronique"
                  className={`w-full rounded-xl border ${errors.name ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-black/5 dark:bg-black/50`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
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
