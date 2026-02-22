"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Flame, Star, Play } from "lucide-react";

/* ──────────────── Types ──────────────── */

export interface GameCardData {
  name: string;
  provider: string;
  category: string;
  players: number;
  isHot?: boolean;
  isNew?: boolean;
  thumbnailUrl: string;
  accentColor: string;
  href: string;
}

interface GameCardProps extends GameCardData {
  index: number;
  aspect?: "16/9" | "4/3" | "3/4";
}

/* ──────────────── Skeleton ──────────────── */

function CardSkeleton({ aspect }: { aspect: string }) {
  return (
    <div
      className={`aspect-[${aspect}] animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.03]`}
      style={{ aspectRatio: aspect.replace("/", " / ") }}
    >
      <div className="flex h-full flex-col justify-end p-4">
        <div className="mb-2 h-3 w-2/3 rounded bg-white/[0.06]" />
        <div className="h-2 w-1/3 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

/* ──────────────── Card ──────────────── */

export function GameCard({
  name,
  provider,
  players,
  isHot,
  isNew,
  thumbnailUrl,
  accentColor,
  href,
  index,
  aspect = "16/9",
}: GameCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative"
    >
      <Link href={href}>
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] transition-all duration-500 group-hover:border-gold/25 group-hover:shadow-[0_0_40px_rgba(255,215,0,0.08)]"
          style={{ aspectRatio: aspect.replace("/", " / ") }}
        >
          {/* Skeleton pulse while loading */}
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
          )}

          {/* Image with hover zoom */}
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`
              object-cover transition-all duration-700 ease-out
              group-hover:scale-110
              ${loaded ? "opacity-100" : "opacity-0"}
            `}
            onLoad={() => setLoaded(true)}
            unoptimized={thumbnailUrl.endsWith(".svg")}
          />

          {/* Glass gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            {isHot && (
              <span className="flex items-center gap-1 rounded-full bg-obsidian/60 px-2 py-0.5 text-[9px] font-bold text-orange-400 backdrop-blur-md">
                <Flame className="h-2.5 w-2.5" />
                HOT
              </span>
            )}
            {isNew && (
              <span className="rounded-full bg-obsidian/60 px-2 py-0.5 text-[9px] font-bold text-matrix backdrop-blur-md">
                NEW
              </span>
            )}
          </div>

          {/* Hover: PLAY button + blur */}
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian/40 opacity-0 backdrop-blur-[3px] transition-all duration-300 group-hover:opacity-100">
            <motion.div
              initial={false}
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-obsidian shadow-[0_0_30px_rgba(255,215,0,0.35)]"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              PLAY
            </motion.div>
          </div>

          {/* Bottom info */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-sm font-bold leading-tight text-white">{name}</p>
            <p className="text-[10px] text-white/35">{provider}</p>
          </div>
        </div>
      </Link>

      {/* Footer meta */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1 text-[10px] text-white/20">
          <Users className="h-3 w-3" />
          <span>{players.toLocaleString()}</span>
        </div>
        <button className="text-white/10 transition-colors hover:text-gold">
          <Star className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ──────────────── Game Data ──────────────── */

export const GAME_DATA: GameCardData[] = [
  { name: "Crypto Mines", provider: "Rapid Originals", category: "originals", players: 4281, isHot: true, thumbnailUrl: "/images/games/mines-thumb.svg", accentColor: "purple", href: "/dashboard/originals/mines" },
  { name: "Lunar Crash", provider: "Rapid Originals", category: "originals", players: 8012, isHot: true, thumbnailUrl: "/images/games/crash-thumb.svg", accentColor: "blue", href: "#" },
  { name: "Neon Plinko", provider: "Rapid Originals", category: "originals", players: 3291, isNew: true, thumbnailUrl: "/images/games/plinko-thumb.svg", accentColor: "emerald", href: "#" },
  { name: "Shadow Dice", provider: "Rapid Originals", category: "originals", players: 2019, thumbnailUrl: "/images/games/dice-thumb.svg", accentColor: "red", href: "#" },
  { name: "Void Towers", provider: "Rapid Originals", category: "originals", players: 1587, isNew: true, thumbnailUrl: "/images/games/towers-thumb.svg", accentColor: "violet", href: "#" },
  { name: "Quantum Roulette", provider: "Evolution", category: "live", players: 9420, isHot: true, thumbnailUrl: "/images/games/roulette-thumb.svg", accentColor: "gold", href: "/dashboard/live" },
  { name: "Neon Blackjack", provider: "Pragmatic Play", category: "live", players: 6102, thumbnailUrl: "/images/games/roulette-thumb.svg", accentColor: "sky", href: "/dashboard/live" },
  { name: "HiLo Extreme", provider: "Rapid Originals", category: "originals", players: 1102, thumbnailUrl: "/images/games/dice-thumb.svg", accentColor: "pink", href: "#" },
  { name: "Keno Blitz", provider: "Rapid Originals", category: "originals", players: 843, isNew: true, thumbnailUrl: "/images/games/plinko-thumb.svg", accentColor: "sky", href: "#" },
  { name: "Limbo Rush", provider: "Rapid Originals", category: "originals", players: 2451, isHot: true, thumbnailUrl: "/images/games/crash-thumb.svg", accentColor: "orange", href: "#" },
];

/* ──────────────── Lobby Row ──────────────── */

interface GameLobbyRowProps {
  title: string;
  icon: React.ReactNode;
  games: GameCardData[];
}

function GameLobbyRow({ title, icon, games }: GameLobbyRowProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-sm font-semibold text-white/60">{title}</h3>
        <span className="text-[10px] text-white/20">{games.length} games</span>
        <button className="ml-auto text-[10px] font-medium text-gold/40 transition-colors hover:text-gold">
          View All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {games.map((game, i) => (
          <div key={game.name} className="w-52 shrink-0">
            <GameCard {...game} index={i} aspect="3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameLobby() {
  const originals = GAME_DATA.filter((g) => g.category === "originals");
  const live = GAME_DATA.filter((g) => g.category === "live");
  const hot = GAME_DATA.filter((g) => g.isHot);

  return (
    <div>
      <GameLobbyRow
        title="Trending Now"
        icon={<Flame className="h-4 w-4 text-orange-400" />}
        games={hot}
      />
      <GameLobbyRow
        title="Rapid Originals"
        icon={<Star className="h-4 w-4 text-gold" />}
        games={originals}
      />
      <GameLobbyRow
        title="Live Casino"
        icon={<Users className="h-4 w-4 text-matrix" />}
        games={live}
      />
    </div>
  );
}
