"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bomb,
  Diamond,
  Pickaxe,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  HandCoins,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import { useMinesStore, type GamePhase } from "@/stores/mines-store";
import { useBalanceStore } from "@/stores/balance-store";
import { startMinesGame, revealMinesTile, cashOutMines } from "./mines-action";

/* ──────────────────── Animations ──────────────────── */

const tileFlipVariants = {
  hidden: { rotateY: 180, scale: 0.8, opacity: 0 },
  visible: {
    rotateY: 0,
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const shakeVariant = {
  shake: {
    x: [0, -16, 16, -12, 12, -6, 6, 0],
    transition: { duration: 0.5 },
  },
};

const goldPulseVariant = {
  pulse: {
    boxShadow: [
      "0 0 0px rgba(255,215,0,0)",
      "0 0 60px rgba(255,215,0,0.4)",
      "0 0 120px rgba(255,215,0,0.2)",
      "0 0 0px rgba(255,215,0,0)",
    ],
    transition: { duration: 0.8 },
  },
};

/* ──────────────────── Tile Component ──────────────────── */

function MineTile({
  index,
  revealed,
  isMine,
  phase,
  onClick,
}: {
  index: number;
  revealed: boolean;
  isMine: boolean;
  phase: GamePhase;
  onClick: () => void;
}) {
  const isGameOver = phase === "won" || phase === "lost";
  const canClick = phase === "playing" && !revealed;

  return (
    <motion.button
      whileHover={canClick ? { scale: 1.06, y: -2 } : {}}
      whileTap={canClick ? { scale: 0.95 } : {}}
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={`
        group relative aspect-square w-full overflow-hidden rounded-xl border
        backdrop-blur-md transition-all duration-300 game-tile
        ${revealed
          ? isMine
            ? "border-red-500/30 bg-red-500/10"
            : "border-matrix/20 bg-matrix/[0.06]"
          : canClick
            ? "border-white/[0.08] bg-white/[0.04] hover:border-gold/20 hover:bg-white/[0.08] cursor-pointer"
            : "border-white/[0.04] bg-white/[0.02] cursor-default"
        }
        ${isGameOver && !revealed ? "opacity-40" : ""}
      `}
      style={{ perspective: "600px" }}
    >
      <AnimatePresence mode="wait">
        {revealed ? (
          <motion.div
            key="revealed"
            variants={tileFlipVariants}
            initial="hidden"
            animate="visible"
            className="flex h-full w-full items-center justify-center"
          >
            {isMine ? (
              <Bomb className="h-6 w-6 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] sm:h-8 sm:w-8" />
            ) : (
              <Diamond className="h-6 w-6 text-matrix drop-shadow-[0_0_10px_rgba(0,255,65,0.5)] sm:h-8 sm:w-8" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hidden"
            exit={{ rotateY: 90, opacity: 0, transition: { duration: 0.15 } }}
            className="flex h-full w-full items-center justify-center"
          >
            {phase === "playing" && (
              <div className="h-2 w-2 rounded-full bg-white/[0.08] transition-colors group-hover:bg-gold/30" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle grid shine on hover */}
      {canClick && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </motion.button>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function MinesPage() {
  const store = useMinesStore();
  const balanceStore = useBalanceStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPlaying = store.phase === "playing";
  const isGameOver = store.phase === "won" || store.phase === "lost";

  /* ── Start Game ── */
  const handleStart = useCallback(async () => {
    setLoading(true);
    const res = await startMinesGame(
      store.betAmount,
      store.minesCount,
      store.clientSeed,
      store.nonce
    );
    setLoading(false);

    if (!res.ok) {
      alert(res.error);
      return;
    }

    // Optimistic balance deduction
    balanceStore.setBalance(parseFloat(res.balance).toFixed(2));
    store.startGame(res.seedHash, res.nonce);
  }, [store, balanceStore]);

  /* ── Reveal Tile ── */
  const handleReveal = useCallback(
    async (index: number) => {
      if (store.revealedTiles.includes(index)) return;

      // Optimistic reveal
      store.revealTile(index);

      const res = await revealMinesTile(index, store.nonce);
      if (!res.ok) return;

      if (!res.safe) {
        store.hitMine(res.minePositions, res.serverSeed);
      }
    },
    [store]
  );

  /* ── Cash Out ── */
  const handleCashOut = useCallback(async () => {
    if (store.revealedTiles.length === 0) return;
    setLoading(true);

    const res = await cashOutMines(store.revealedTiles, store.nonce);
    setLoading(false);

    if (!res.ok) {
      alert(res.error);
      return;
    }

    balanceStore.setBalance(parseFloat(res.balance).toFixed(2));
    store.cashOut(res.payout, res.serverSeed);
  }, [store, balanceStore]);

  /* ── Copy seed hash ── */
  const copySeedHash = () => {
    navigator.clipboard.writeText(store.serverSeedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ── Glitch overlay on mine hit ── */
  const [showGlitch, setShowGlitch] = useState(false);
  useEffect(() => {
    if (store.phase === "lost") {
      setShowGlitch(true);
      const t = setTimeout(() => setShowGlitch(false), 800);
      return () => clearTimeout(t);
    }
  }, [store.phase]);

  /* ── Compute which tiles are mines (for display after game over) ── */
  const isMine = (i: number) => store.minePositions.includes(i);
  const isRevealed = (i: number) =>
    store.revealedTiles.includes(i) ||
    (isGameOver && store.minePositions.includes(i));

  return (
    <div className="relative min-h-full p-4 sm:p-6">
      {/* Glitch overlay */}
      <AnimatePresence>
        {showGlitch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 bg-red-900/10 mix-blend-overlay"
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,0,0.03)_2px,rgba(255,0,0,0.03)_4px)] animate-[scan-line_0.5s_linear]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          href="/dashboard/originals"
          className="inline-flex items-center gap-2 text-xs text-white/25 transition-colors hover:text-white/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Originals
        </Link>
      </motion.div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ────── Game Board ────── */}
        <motion.div
          variants={store.phase === "lost" ? shakeVariant : goldPulseVariant}
          animate={
            store.phase === "lost" ? "shake" : store.phase === "won" ? "pulse" : undefined
          }
        >
          <GlassPanel
            glow={store.phase === "won" ? "gold" : store.phase === "lost" ? "none" : "gold"}
            padding={false}
            className={`
              overflow-hidden p-4 sm:p-6 game-panel transition-colors duration-500
              ${store.phase === "won" ? "border-gold/30" : ""}
              ${store.phase === "lost" ? "border-red-500/20" : ""}
            `}
          >
            {/* HUD */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pickaxe className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-white">CRYPTO MINES</span>
              </div>
              <div className="flex gap-3 font-mono text-[11px]">
                <span className="text-white/25">
                  MULT{" "}
                  <span
                    className={`font-bold ${
                      store.multiplier > 1 ? "text-matrix matrix-glow" : "text-white/50"
                    }`}
                  >
                    {store.multiplier.toFixed(2)}x
                  </span>
                </span>
                <span className="text-white/25">
                  NEXT{" "}
                  <span className="font-bold text-gold">
                    {isPlaying ? `${store.nextTileValue.toFixed(2)}x` : "—"}
                  </span>
                </span>
                <span className="hidden text-white/25 sm:inline">
                  BET{" "}
                  <span className="font-bold text-white/50">
                    {store.betAmount.toFixed(2)}
                  </span>
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-white/[0.04]" />

            {/* 5×5 Grid */}
            <div className="mx-auto mt-4 grid max-w-md grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: 25 }).map((_, i) => (
                <MineTile
                  key={i}
                  index={i}
                  revealed={isRevealed(i)}
                  isMine={isMine(i)}
                  phase={store.phase}
                  onClick={() => handleReveal(i)}
                />
              ))}
            </div>

            {/* Game-over banner */}
            <AnimatePresence>
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center"
                >
                  {store.phase === "won" ? (
                    <>
                      <p className="text-lg font-bold text-gold">
                        YOU CASHED OUT
                      </p>
                      <p className="mt-1 font-mono text-2xl font-black text-matrix matrix-glow">
                        +{store.payout.toFixed(2)}
                      </p>
                      <p className="mt-1 text-[11px] text-white/20">
                        {store.multiplier.toFixed(2)}x multiplier
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-red-400">
                        MINE HIT
                      </p>
                      <p className="mt-1 font-mono text-2xl font-black text-red-400/70">
                        −{store.betAmount.toFixed(2)}
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        </motion.div>

        {/* ────── Controls Sidebar ────── */}
        <div className="flex flex-col gap-4">
          {/* Bet Controls */}
          <GlassPanel glow="none" className="p-5 game-panel">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">
              Game Setup
            </h3>

            {/* Bet Amount */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Bet Amount
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => store.setBetAmount(store.betAmount / 2)}
                  disabled={isPlaying}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={store.betAmount}
                  onChange={(e) => store.setBetAmount(parseFloat(e.target.value) || 0)}
                  disabled={isPlaying}
                  className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-white/70 outline-none transition-colors focus:border-gold/20 disabled:opacity-50"
                  step="0.01"
                  min="0.01"
                />
                <button
                  onClick={() => store.setBetAmount(store.betAmount * 2)}
                  disabled={isPlaying}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mines Count */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Mines ({store.minesCount})
              </label>
              <input
                type="range"
                min={1}
                max={24}
                value={store.minesCount}
                onChange={(e) => store.setMinesCount(parseInt(e.target.value))}
                disabled={isPlaying}
                className="w-full accent-gold disabled:opacity-30"
              />
              <div className="mt-1 flex justify-between text-[10px] text-white/15">
                <span>1</span>
                <span>24</span>
              </div>
            </div>

            {/* Action Buttons */}
            {store.phase === "idle" || isGameOver ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={isGameOver ? store.reset : handleStart}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-xs font-bold uppercase tracking-widest text-obsidian cta-glow game-button transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isGameOver ? (
                  "NEW GAME"
                ) : (
                  <>
                    <Pickaxe className="h-3.5 w-3.5" />
                    START MINING
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCashOut}
                disabled={loading || store.revealedTiles.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-matrix/20 bg-matrix/10 py-3 text-xs font-bold uppercase tracking-widest text-matrix game-button transition-all hover:bg-matrix/15 disabled:opacity-30"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <HandCoins className="h-3.5 w-3.5" />
                    CASH OUT ({(store.betAmount * store.multiplier).toFixed(2)})
                  </>
                )}
              </motion.button>
            )}
          </GlassPanel>

          {/* Fairness Panel */}
          <GlassPanel glow="none" className="p-5 game-panel">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold/50" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">
                Provably Fair
              </h3>
            </div>

            {/* Seed Hash */}
            <div className="mb-3">
              <label className="mb-1 block text-[10px] text-white/20">
                Server Seed Hash
              </label>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 truncate rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/30">
                  {store.serverSeedHash || "—"}
                </code>
                {store.serverSeedHash && (
                  <button
                    onClick={copySeedHash}
                    className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5 text-white/20 transition-colors hover:text-white/50"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-matrix" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Revealed Server Seed */}
            {store.serverSeed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="mb-1 block text-[10px] text-white/20">
                  Server Seed (revealed)
                </label>
                <code className="block truncate rounded-lg border border-matrix/10 bg-matrix/[0.03] px-2.5 py-1.5 font-mono text-[10px] text-matrix/50">
                  {store.serverSeed}
                </code>
              </motion.div>
            )}

            {/* Client Seed */}
            <div className="mt-3">
              <label className="mb-1 block text-[10px] text-white/20">
                Client Seed
              </label>
              <input
                type="text"
                value={store.clientSeed}
                onChange={(e) => store.setClientSeed(e.target.value)}
                disabled={isPlaying}
                className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/40 outline-none transition-colors focus:border-gold/20 disabled:opacity-40"
              />
            </div>

            <p className="mt-3 text-[9px] leading-relaxed text-white/10">
              The hash is shown before game start. After game over, the raw seed
              is revealed so you can verify SHA-256(seed) === hash.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
