"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Sparkles, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface VaultGame {
  name: string;
  tagline: string;
  thumbnailUrl: string;
  accentColor: string;
  players: string;
  maxWin: string;
}

const vaultGames: VaultGame[] = [
  {
    name: "CRYPTO MINES",
    tagline: "Navigate the grid. Avoid the traps.",
    thumbnailUrl: "/images/games/mines-thumb.svg",
    accentColor: "group-hover:border-purple-500/30",
    players: "4,281",
    maxWin: "100x",
  },
  {
    name: "QUANTUM ROULETTE",
    tagline: "Spin the quantum wheel. Defy the odds.",
    thumbnailUrl: "/images/games/roulette-thumb.svg",
    accentColor: "group-hover:border-gold/30",
    players: "6,102",
    maxWin: "36x",
  },
  {
    name: "SHADOW DICE",
    tagline: "Roll above or below. Infinite strategy.",
    thumbnailUrl: "/images/games/dice-thumb.svg",
    accentColor: "group-hover:border-red-500/30",
    players: "2,019",
    maxWin: "99x",
  },
  {
    name: "LUNAR CRASH",
    tagline: "Ride the curve. Cash out before impact.",
    thumbnailUrl: "/images/games/crash-thumb.svg",
    accentColor: "group-hover:border-blue-500/30",
    players: "8,012",
    maxWin: "∞",
  },
];

function VaultCard({ game, index }: { game: VaultGame; index: number }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl transition-all duration-500 ${game.accentColor} hover:shadow-[0_0_50px_rgba(255,215,0,0.06),inset_0_1px_0_rgba(255,215,0,0.1)]`}
      >
        {/* Image section — 4:3 */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
          )}
          <Image
            src={game.thumbnailUrl}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className={`
              object-cover transition-transform duration-700 ease-out
              group-hover:scale-110
              ${loaded ? "opacity-100" : "opacity-0"}
            `}
            onLoad={() => setLoaded(true)}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent" />

          {/* Hover PLAY overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian/40 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-obsidian shadow-[0_0_30px_rgba(255,215,0,0.35)]">
              <Play className="h-3.5 w-3.5 fill-current" />
              PLAY
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h4 className="text-sm font-bold tracking-wider text-white/80 transition-colors group-hover:text-white">
            {game.name}
          </h4>
          <p className="mt-0.5 text-[11px] text-white/25 transition-colors group-hover:text-white/40">
            {game.tagline}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-4 text-[10px]">
              <span className="text-white/20">
                <span className="text-white/40">{game.players}</span> playing
              </span>
              <span className="text-white/20">
                Max <span className="font-semibold text-gold">{game.maxWin}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TheVault() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="vault"
      className="relative flex min-h-[100svh] items-center px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/10 to-transparent" />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left: Animated text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/15 bg-gold/[0.04] px-3 py-1 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-gold/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold/60">
              Exclusive Collection
            </span>
          </div>

          <h2 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            The{" "}
            <span className="text-gradient-gold">Vault</span>
          </h2>

          <p className="mb-6 max-w-md text-base leading-relaxed text-white/35 sm:text-lg">
            Four originals. Built in-house with provably fair RNG.
            The lowest house edge in the industry —{" "}
            <span className="font-medium text-matrix">just 1%</span>.
          </p>

          <div className="mb-8 flex flex-col gap-3 text-sm text-white/30">
            {[
              "Provably fair with crypto.getRandomValues()",
              "Instant payouts — no withdrawal queue",
              "Server-side game state for zero manipulation",
            ].map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-2"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-matrix/10 text-matrix">
                  <ChevronRight className="h-3 w-3" />
                </span>
                <span>{point}</span>
              </motion.div>
            ))}
          </div>

          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="cta-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-obsidian"
            >
              UNLOCK THE VAULT
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Right: 2x2 image grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vaultGames.map((game, i) => (
            <VaultCard key={game.name} game={game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
