'use client';

import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none">
      {/* Background glow decoration */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      
      <div className="relative flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</p>
          <h3 className={cn(
            "text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 transition-all",
            isLoading && "blur-sm animate-pulse"
          )}>
            {value}
          </h3>
        </div>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
          <Icon className="h-6 w-6" strokeWidth={2} />
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="relative mt-5 flex items-center gap-3">
          {trend && (
            <div className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-black",
              trend.isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}>
              <TrendingUp className={cn("h-3 w-3", !trend.isPositive && "rotate-180")} />
              {trend.value.toFixed(1)}%
            </div>
          )}
          {description && (
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
