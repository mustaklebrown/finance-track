'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Receipt, 
  Plus, 
  ArrowLeft, 
  TrendingDown,
  Trash2,
  Calendar,
  Edit2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const ExpenseSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  amount: z.number().min(0, 'Le montant doit être positif'),
  date: z.string().min(1, 'La date est requise'),
  category: z.string().min(1, 'La catégorie est requise')
});
type ExpenseFormData = z.infer<typeof ExpenseSchema>;

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      name: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'Fixed'
    }
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      const url = editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses';
      const method = editingExpenseId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowAddForm(false);
        setEditingExpenseId(null);
        reset();
        fetchExpenses();
      } else {
        const errorData = await res.json();
        alert('Erreur: ' + (errorData.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setValue('name', expense.name);
    setValue('amount', expense.amount);
    setValue('category', expense.category);
    setValue('date', expense.date.split('T')[0]);
    setShowAddForm(true);
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
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
              Dépenses Journalières
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Gérez et suivez vos dépenses et charges quotidiennes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setEditingExpenseId(null);
              reset({ date: new Date().toISOString().split('T')[0], amount: 0, name: '', category: 'Fixed' });
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-rose-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Dépense
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Dépenses (Mois)</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
            {expenses.reduce((acc, exp) => acc + exp.amount, 0).toLocaleString()} KMF
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-1">
            <Receipt className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Nombre de Dépenses</span>
          </div>
          <div className="text-2xl font-bold">
            {expenses.length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Date</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Description</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Catégorie</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Montant</th>
                <th className="px-6 py-4 text-right sticky right-0 z-10 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                    <td className="px-6 py-4 flex justify-end"><div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" /></td>
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    Aucune dépense enregistrée. Cliquez sur "Nouvelle Dépense".
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(expense.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {expense.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-rose-600">
                      - {expense.amount.toLocaleString()} KMF
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs transition-colors group-hover:bg-zinc-50/90 dark:group-hover:bg-zinc-800/90 border-l border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteExpense(expense.id)}
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

      {/* Add Expense Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-rose-600" />
                {editingExpenseId ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Date</label>
                <input 
                  type="date" 
                  {...register('date')}
                  className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 dark:bg-black/50 dark:border-zinc-800", errors.date ? "border-rose-500" : "border-zinc-200")}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Librllé (Description) *</label>
                <input 
                  {...register('name')}
                  placeholder="ex: Achat fournitures"
                  className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 dark:bg-black/50 dark:border-zinc-800", errors.name ? "border-rose-500" : "border-zinc-200")}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Catégorie *</label>
                <select 
                  {...register('category')}
                  className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 dark:bg-black/50 dark:border-zinc-800", errors.category ? "border-rose-500" : "border-zinc-200")}
                >
                  <option value="Fixed">Frais Fixes (Loyer, Salaire...)</option>
                  <option value="Variable">Frais Variables (Marchandise...)</option>
                  <option value="Marketing">Marketing / Publicité</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Montant (KMF) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className={cn("w-full rounded-xl border bg-zinc-50/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 dark:bg-black/50 dark:border-zinc-800 text-rose-600 font-bold", errors.amount ? "border-rose-500" : "border-zinc-200")}
                />
                {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
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
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : editingExpenseId ? 'Mettre à jour' : 'Ajouter la dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
