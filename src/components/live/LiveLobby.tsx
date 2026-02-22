"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2 } from "lucide-react";
import type { LiveTable, TableCategory } from "@/lib/live-tables";
import { LiveCard } from "./LiveCard";
import { StickyFilterBar } from "./StickyFilterBar";
import { EmptyState } from "./EmptyState";

interface PageResponse {
  data: LiveTable[];
  nextPage: number | null;
  total: number;
}

async function fetchTables({
  pageParam = 0,
  category,
  search,
}: {
  pageParam?: number;
  category: TableCategory;
  search: string;
}): Promise<PageResponse> {
  const params = new URLSearchParams({
    page: String(pageParam),
    category,
    search,
  });
  const res = await fetch(`/api/live-tables?${params}`);
  if (!res.ok) throw new Error("Failed to fetch tables");
  return res.json();
}

export function LiveLobby() {
  const [category, setCategory] = useState<TableCategory>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["live-tables", category, debouncedSearch],
    queryFn: ({ pageParam }) =>
      fetchTables({ pageParam, category, search: debouncedSearch }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const allTables = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;
  const hasFilters = category !== "all" || debouncedSearch.length > 0;

  const clearFilters = () => {
    setCategory("all");
    setSearch("");
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-matrix/10">
            <Radio className="h-4 w-4 text-matrix drop-shadow-[0_0_6px_rgba(0,255,65,0.5)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Live Casino</h1>
            <p className="text-[11px] text-white/25">
              Real dealers. Real-time. Zero trust required.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter bar */}
      <StickyFilterBar
        activeCategory={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
        totalCount={totalCount}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/10] animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center py-24">
          <p className="text-sm text-red-400/60">
            Failed to load tables. Please try again.
          </p>
        </div>
      )}

      {/* Table grid */}
      {!isLoading && !isError && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${category}-${debouncedSearch}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {allTables.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allTables.map((table, i) => (
                  <LiveCard key={table.id} table={table} index={i % 8} />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin text-gold/40" />
                <span className="text-xs font-mono text-white/20">
                  Loading more tables...
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
