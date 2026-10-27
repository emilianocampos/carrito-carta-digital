'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import type { PublicCategory } from '@/features/catalog/queries';

interface CategoryNavProps {
  categories: PublicCategory[];
  totalProductsCount: number;
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CategoryNav({
  categories,
  totalProductsCount,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: CategoryNavProps) {
  return (
    <div className="w-full bg-[#f0f4fc] dark:bg-[#090d16] -mt-6 rounded-t-3xl relative z-20 pt-5 transition-colors shadow-[0_-8px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.35)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3.5 sm:space-y-4">
        {/* Fila Superior: Título "Nuestro Menú" */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Nuestro Menú
          </h1>
        </div>

        {/* Buscador full width idéntico a la referencia */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en el menú..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-11 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Píldoras de Categorías - STICKY debajo del Navbar superior */}
      <div className="sticky top-[57px] sm:top-[64px] z-30 bg-[#f0f4fc]/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 mt-3 transition-colors shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Píldora "Todo" */}
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              style={
                selectedCategoryId === 'all'
                  ? { backgroundColor: 'var(--theme-primary, #00dc82)' }
                  : undefined
              }
              className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 select-none cursor-pointer active:scale-95 ${
                selectedCategoryId === 'all'
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <span>Todo</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  selectedCategoryId === 'all'
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {totalProductsCount}
              </span>
            </button>

            {/* Categorías dinámicas */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  style={
                    isSelected
                      ? { backgroundColor: 'var(--theme-primary, #00dc82)' }
                      : undefined
                  }
                  className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 select-none cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cat.products.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
