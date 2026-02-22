"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pickaxe, Rocket, CircleDot, Dice5, Layers, Play, Sparkles, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface OriginalGame {
  name: string;
  desc: string;
  icon: LucideIcon;
  thumbnailUrl: string;
  accentColor: string;
  accentBorder: string;
  edge: string;
  max: string;
  players: string;
  href: string;
}

const games: OriginalGame[] = [
  { name: "CRYPTO MINES", desc: "Navigate the grid. Avoid the traps. Multiply your stake.", icon: Pickaxe, thumbnailUrl: "/images/games/mines-thumb.svg", accentColor: "text-purple-400", accentBorder: "group-hover:border-purple-500/30", edge: "1%", max: "100x", players: "4,281", href: "/dashboard/originals/mines" },
  { name: "LUNAR CRASH", desc: "Ride the curve. Cash out before the crash.", icon: Rocket, thumbnailUrl: "/images/games/crash-thumb.svg", accentColor: "text-blue-400", accentBorder: "group-hover:border-blue-500/30", edge: "1%", max: "∞", players: "8,012", href: "/dashboard/originals/crash" },
  { name: "NEON PLINKO", desc: "Drop the ball. Watch it bounce. Hit the golden pocket.", icon: CircleDot, thumbnailUrl: "/images/games/plinko-thumb.svg", accentColor: "text-emerald-400", accentBorder: "group-hover:border-emerald-500/30", edge: "1%", max: "1,000x", players: "3,291", href: "/dashboard/originals/plinko" },
  { name: "SHADOW DICE", desc: "Roll above or below. Simple mechanics. Infinite strategy.", icon: Dice5, thumbnailUrl: "/images/games/dice-thumb.svg", accentColor: "text-red-400", accentBorder: "group-hover:border-red-500/30", edge: "1%", max: "99x", players: "2,019", href: "/dashboard/originals/dice" },
  { name: "VOID TOWERS", desc: "Climb the tower. Each floor doubles the risk.", icon: Layers, thumbnailUrl: "/images/games/towers-thumb.svg", accentColor: "text-violet-400", accentBorder: "group-hover:border-violet-500/30", edge: "1%", max: "500x", players: "1,587", href: "/dashboard/originals/towers" },
  { name: "CYBER SLOTS", desc: "Spin the underground reels. Hit the scatter for chaos.", icon: Sparkles, thumbnailUrl: "/images/games/slots-thumb.svg", accentColor: "text-amber-400", accentBorder: "group-hover:border-amber-500/30", edge: "2%", max: "100x", players: "5,430", href: "/dashboard/originals/slots" },
  { name: "HACK THE VAULT", desc: "Three nodes. One firewall. Breach every floor to win.", icon: ShieldAlert, thumbnailUrl: "/images/games/vault-thumb.svg", accentColor: "text-cyan-400", accentBorder: "group-hover:border-cyan-500/30", edge: "1%", max: "24.81x", players: "2,891", href: "/dashboard/originals/vault" },
];

function OriginalCard({ game, index }: { game: OriginalGame; index: number }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="group"
    >
      <Link href={game.href}>
        <div
          className={`relative overflow-hidden rounded-2xl neon-border scanline-overlay transition-all duration-500 ${game.accentBorder} hover:shadow-[0_0_40px_rgba(255,215,0,0.06)]`}
        >
          {/* Image section — 16:9 */}
          <div className="relative aspect-[16/9] overflow-hidden">
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
            )}
            <Image
              src={game.thumbnailUrl}
              alt={game.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`
                object-cover transition-transform duration-700 ease-out
                group-hover:scale-110
                ${loaded ? "opacity-100" : "opacity-0"}
              `}
              onLoad={() => setLoaded(true)}
              unoptimized={game.thumbnailUrl.endsWith(".svg")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />

            {/* Hover PLAY overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-obsidian/40 opacity-0 backdrop-blur-[3px] transition-all duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-obsidian shadow-[0_0_30px_rgba(255,215,0,0.35)]">
                <Play className="h-3.5 w-3.5 fill-current" />
                PLAY NOW
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="relative bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-all group-hover:border-gold/20 group-hover:bg-gold/[0.06]">
                <game.icon className={`h-4 w-4 ${game.accentColor} transition-colors group-hover:text-gold`} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wider text-white/80 transition-colors group-hover:text-white">
                  {game.name}
                </h3>
                <p className="text-[11px] text-white/25">{game.desc}</p>
              </div>
            </div>

            <div className="flex gap-4 text-[10px]">
              <span className="text-white/20">Edge <span className="font-semibold text-matrix">{game.edge}</span></span>
              <span className="text-white/20">Max <span className="font-semibold text-gold">{game.max}</span></span>
              <span className="text-white/20"><span className="text-white/40">{game.players}</span> live</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function OriginalsPage() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Rapid Originals</h1>
        <p className="mt-1 text-sm text-white/30">
          Built in-house. Provably fair. 1% house edge.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game, i) => (
          <OriginalCard key={game.name} game={game} index={i} />
        ))}
      </div>
    </div>
  );
}
