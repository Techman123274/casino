"use client";

import { motion } from "framer-motion";
import { Users, Zap } from "lucide-react";
import Image from "next/image";
import type { LiveTable } from "@/lib/live-tables";

interface LiveCardProps {
  table: LiveTable;
  index: number;
}

export function LiveCard({ table, index }: LiveCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      className="group relative"
    >
      <div
        className={`
          relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08]
          bg-gradient-to-br ${table.thumbnailGradient}
          transition-all duration-500 ease-out
          group-hover:scale-[1.03] group-hover:border-gold/20
          group-hover:shadow-[0_0_40px_rgba(255,215,0,0.12)]
        `}
      >
        {/* Animated "video feed" simulation */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 animate-[pulse-glow_3s_ease-in-out_infinite] bg-gradient-to-t from-transparent via-white/[0.03] to-transparent" />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"
            style={{ animationDelay: `${index * 200}ms` }}
          />
        </div>

        {/* Scan line overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

        {/* Top badges row */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {/* Player count */}
          <div className="flex items-center gap-1.5 rounded-full bg-obsidian/60 px-2.5 py-1 text-[11px] font-medium text-white/70 backdrop-blur-md">
            <Users className="h-3 w-3 text-white/50" />
            {table.playerCount.toLocaleString()}
          </div>

          {/* LIVE indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-obsidian/60 px-2.5 py-1 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-matrix opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-matrix" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-matrix">LIVE</span>
          </div>
        </div>

        {/* VIP badge */}
        {table.isVip && (
          <div className="absolute left-3 top-11 flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 backdrop-blur-md">
            <Zap className="h-3 w-3 text-gold" />
            <span className="text-[9px] font-bold tracking-widest text-gold">VIP</span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          {/* Dealer info */}
          <div className="mb-2 flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <Image
                src={table.dealer.avatar}
                alt={table.dealer.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-[11px] font-medium text-white/50">
              {table.dealer.name}
            </span>
          </div>

          {/* Table name */}
          <h3 className="text-sm font-bold leading-tight text-white">
            {table.name}
          </h3>

          {/* Bet limits */}
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[11px] font-mono text-white/30">
              ${table.minBet < 1 ? table.minBet.toFixed(1) : table.minBet.toLocaleString()}
              {" – "}
              ${table.maxBet >= 1000 ? `${(table.maxBet / 1000).toFixed(0)}k` : table.maxBet}
            </span>
          </div>
        </div>

        {/* Hover overlay with Quick Join */}
        <div className="absolute inset-0 flex items-center justify-center bg-obsidian/50 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-obsidian shadow-[0_0_30px_rgba(255,215,0,0.35)] transition-shadow hover:shadow-[0_0_50px_rgba(255,215,0,0.5)]"
          >
            Quick Join
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
