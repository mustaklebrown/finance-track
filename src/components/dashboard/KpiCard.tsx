'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
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
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 transition-all hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <h3 className={cn(
            "mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50",
            isLoading && "blur-sm animate-pulse"
          )}>
            {value}
          </h3>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </span>
          )}
          {description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
          )}
        </div>
      )}
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
};
