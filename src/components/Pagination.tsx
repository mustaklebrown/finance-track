'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  itemsPerPageOptions?: number[];
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100]
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Info & Per Page */}
      <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">
          {startItem}–{endItem} <span className="text-zinc-400 dark:text-zinc-500">sur</span> {totalItems}
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Lignes:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-700 outline-none transition-all hover:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
            >
              {itemsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            currentPage === 1
              ? "text-zinc-300 cursor-not-allowed dark:text-zinc-600"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
          title="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            currentPage === 1
              ? "text-zinc-300 cursor-not-allowed dark:text-zinc-600"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
          title="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={`dots-${idx}`} className="flex h-8 w-8 items-center justify-center text-xs text-zinc-400">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all",
                currentPage === page
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
            >
              {page}
            </button>
          )
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            currentPage === totalPages
              ? "text-zinc-300 cursor-not-allowed dark:text-zinc-600"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
          title="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            currentPage === totalPages
              ? "text-zinc-300 cursor-not-allowed dark:text-zinc-600"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
          title="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to manage pagination state.
 * Usage:
 *   const { page, perPage, setPage, setPerPage, paginate } = usePagination(items);
 *   const displayed = paginate(items);
 */
export function usePagination(defaultPerPage = 10) {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(defaultPerPage);

  const paginate = <T,>(items: T[]): T[] => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1); // Reset to first page when changing items per page
  };

  return { page, perPage, setPage, setPerPage: handlePerPageChange, paginate };
}
