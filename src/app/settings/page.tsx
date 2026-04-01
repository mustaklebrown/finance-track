'use client';

import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun,
  Monitor,
  Command,
  Mail,
  Lock,
  LogOut,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    alerts: true,
    weekly: true
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 font-sans transition-colors duration-500">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
              Paramètres du Compte
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">Gérez vos préférences et la sécurité de votre compte</p>
        </div>
      </header>

      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Section */}
        <aside className="lg:col-span-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 h-fit overflow-hidden">
          <nav className="flex flex-col p-2">
            {[
              { label: 'Profil', icon: User, active: true },
              { label: 'Notifications', icon: Bell, active: false },
              { label: 'Sécurité', icon: Shield, active: false },
              { label: 'Langage & Région', icon: Globe, active: false },
            ].map((item, i) => (
              <button 
                key={i}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                  item.active ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Form Sections */}
        <div className="lg:col-span-3 space-y-8">
          {/* Profile Card */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold">Informations de Profil</h3>
              <p className="text-sm text-zinc-500">Mettez à jour vos informations publiques</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold ring-4 ring-zinc-50 dark:ring-zinc-900">
                    A
                  </div>
                  <button className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-xs font-bold">
                    Editer
                  </button>
                </div>
                <div className="space-y-4 flex-1 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Prénom</label>
                      <input className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5" defaultValue="Admin" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nom</label>
                      <input className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5" defaultValue="Finance" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email</label>
                    <input className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5" defaultValue="admin@finance.com" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors">Annuler</button>
              <button className="px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95">Sauvegarder</button>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold">Thème de l'Interface</h3>
              <p className="text-sm text-zinc-500">Choisissez l'apparence visuelle de l'application</p>
            </div>
            
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { id: 'light', label: 'Clair', icon: Sun },
                { id: 'dark', label: 'Sombre', icon: Moon },
                { id: 'system', label: 'Système', icon: Monitor },
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                    theme === t.id ? "border-black dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-800" : "border-transparent bg-zinc-100/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <t.icon className={cn("h-6 w-6", theme === t.id ? "text-black dark:text-white" : "text-zinc-400")} />
                  <span className={cn("text-sm font-bold", theme === t.id ? "text-black dark:text-white" : "text-zinc-400")}>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* DANGER AREA */}
          <section className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl overflow-hidden transition-all hover:bg-rose-50/50">
             <div className="p-6 flex items-center justify-between">
               <div>
                  <h3 className="text-rose-900 dark:text-rose-400 font-bold">Zone de Danger</h3>
                  <p className="text-sm text-rose-800/80 dark:text-rose-400/60">Une fois supprimée, votre instance de données ne pourra pas être récupérée.</p>
               </div>
               <button className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg transition-transform hover:bg-rose-700 active:scale-95">Effacer Données</button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
