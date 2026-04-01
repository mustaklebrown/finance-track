'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Tags,
  Settings,
  PieChart,
  Menu,
  X,
  LogOut,
  Banknote,
  Receipt,
  Wallet,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  if (isPending) return null;
  if (!session) return null;

  const user = session.user;
  const role = (user as any)?.role || 'STAFF';

  const navItems = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard, minRole: 'STAFF' },
    { href: '/sales', label: 'Ventes', icon: Banknote, minRole: 'STAFF' },
    { href: '/expenses', label: 'Dépenses', icon: Receipt, minRole: 'STAFF' },
    { href: '/products', label: 'Produits', icon: Package, minRole: 'STAFF' },
    { href: '/categories', label: 'Catégories', icon: Tags, minRole: 'STAFF' },
    { href: '/accounting', label: 'Comptabilité', icon: Wallet, minRole: 'MANAGER' },
    { href: '/analytics', label: 'Analyses', icon: PieChart, minRole: 'MANAGER' },
    { href: '/settings', label: 'Paramètres', icon: Settings, minRole: 'OWNER' },
  ];

  const roleHierarchy: Record<string, number> = {
    OWNER: 3,
    MANAGER: 2,
    STAFF: 1,
  };

  const filteredItems = navItems.filter(item => 
    roleHierarchy[role] >= roleHierarchy[item.minRole]
  );

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 rounded-lg p-2 bg-white border border-zinc-200 shadow-sm lg:hidden dark:bg-zinc-900 dark:border-zinc-800"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white px-4 py-8 transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-black lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-2 text-primary font-bold mb-10">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-500">
            Finance Hub
          </h1>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-zinc-100/80 text-black dark:bg-zinc-900 dark:text-white font-semibold" 
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive 
                    ? "text-black dark:text-white" 
                    : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto px-3 py-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
              {user.name?.[0] || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate lowercase">{role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
