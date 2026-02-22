"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import type { TableCategory } from "@/lib/live-tables";

const CATEGORIES: { id: TableCategory; label: string }[] = [
  { id: "all", label: "All Tables" },
  { id: "roulette", label: "Roulette" },
  { id: "blackjack", label: "Blackjack" },
  { id: "baccarat", label: "Baccarat" },
  { id: "game-shows", label: "Game Shows" },
];

interface StickyFilterBarProps {
  activeCategory: TableCategory;
  onCategoryChange: (category: TableCategory) => void;
  search: string;
  onSearchChange: (search: string) => void;
  totalCount: number;
}

export function StickyFilterBar({
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  totalCount,
}: StickyFilterBarProps) {
  return (
    <div className="sticky top-0 z-30 -mx-6 mb-6 border-b border-white/[0.04] bg-obsidian/80 px-6 pb-4 pt-2 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category tabs */}
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
                  relative whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold
                  transition-colors duration-200
                  ${isActive
                    ? "text-gold"
                    : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="live-filter-active"
                    className="absolute inset-0 rounded-xl border border-gold/20 bg-gold/[0.08]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search + count */}
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] font-mono text-white/15 sm:block">
            {totalCount} tables
          </span>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dealer or table..."
              className="h-9 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-8 text-xs text-white/70 placeholder-white/15 outline-none transition-colors focus:border-gold/20 focus:bg-white/[0.05] sm:w-56"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
