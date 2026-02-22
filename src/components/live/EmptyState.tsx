"use client";

import { motion } from "framer-motion";
import { Radio, SearchX } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="col-span-full flex flex-col items-center justify-center py-24"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-[pulse-glow_2s_ease-in-out_infinite] rounded-full bg-gold/10 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md">
          {hasFilters ? (
            <SearchX className="h-8 w-8 text-white/15" />
          ) : (
            <Radio className="h-8 w-8 text-white/15" />
          )}
        </div>
      </div>

      <h3 className="mb-2 text-lg font-bold text-white/40">
        {hasFilters ? "No tables found" : "No live tables"}
      </h3>

      <p className="mb-6 max-w-xs text-center text-sm text-white/15">
        {hasFilters
          ? "No tables match your current filters. Try adjusting your search or category."
          : "Live tables are currently offline. Check back shortly."}
      </p>

      {hasFilters && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClearFilters}
          className="rounded-xl border border-gold/20 bg-gold/[0.06] px-5 py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/[0.1]"
        >
          Clear all filters
        </motion.button>
      )}
    </motion.div>
  );
}
