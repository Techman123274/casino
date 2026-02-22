"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  HandCoins,
  Copy,
  Check,
  ShieldCheck,
  Skull,
  CheckCircle2,
  Lock,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import {
  useTowersStore,
  MULTIPLIERS,
  TILES_PER_ROW,
  type TowersPhase,
  type TowersDifficulty,
} from "@/stores/towers-store";
import { useBalanceStore } from "@/stores/balance-store";
import {
  startTowersGame,
  revealTowersTile,
  cashOutTowers,
} from "./towers-action";

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

const floorEntryVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 200, damping: 20 },
  }),
};

/* ──────────────────── Tile Component ──────────────────── */

function TowerTile({
  floor,
  tileIndex,
  tilesPerRow,
  isCurrentFloor,
  isRevealed,
  isSafe,
  isTrap,
  phase,
  onClick,
  isAboveCurrent,
}: {
  floor: number;
  tileIndex: number;
  tilesPerRow: number;
  isCurrentFloor: boolean;
  isRevealed: boolean;
  isSafe: boolean;
  isTrap: boolean;
  phase: TowersPhase;
  onClick: () => void;
  isAboveCurrent: boolean;
}) {
  const isGameOver = phase === "won" || phase === "lost";
  const canClick = phase === "playing" && isCurrentFloor && !isRevealed;

  return (
    <motion.button
      whileHover={canClick ? { scale: 1.08, y: -2 } : {}}
      whileTap={canClick ? { scale: 0.93 } : {}}
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={`
        group relative overflow-hidden rounded-xl border backdrop-blur-md
        transition-all duration-300
        ${tilesPerRow === 2 ? "h-14 sm:h-16" : "h-14 sm:h-16"}
        ${
          isRevealed
            ? isTrap
              ? "border-red-500/30 bg-red-500/10"
              : "border-matrix/20 bg-matrix/[0.06]"
            : canClick
              ? "border-gold/20 bg-white/[0.04] hover:border-gold/40 hover:bg-white/[0.08] cursor-pointer"
              : isAboveCurrent && !isGameOver
                ? "border-white/[0.03] bg-white/[0.015] cursor-default opacity-30"
                : "border-white/[0.06] bg-white/[0.02] cursor-default"
        }
        ${isGameOver && !isRevealed ? "opacity-25" : ""}
        game-tile
      `}
      style={{ perspective: "600px" }}
    >
      {/* Gold border pulse for current floor */}
      {canClick && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl border border-gold/30"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <AnimatePresence mode="wait">
        {isRevealed ? (
          <motion.div
            key="revealed"
            variants={tileFlipVariants}
            initial="hidden"
            animate="visible"
            className="flex h-full w-full items-center justify-center"
          >
            {isTrap ? (
              <Skull className="h-5 w-5 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] sm:h-6 sm:w-6" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-matrix drop-shadow-[0_0_10px_rgba(0,255,65,0.5)] sm:h-6 sm:w-6" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hidden"
            exit={{ rotateY: 90, opacity: 0, transition: { duration: 0.15 } }}
            className="flex h-full w-full items-center justify-center"
          >
            {isAboveCurrent && !isGameOver ? (
              <Lock className="h-3.5 w-3.5 text-white/[0.08]" />
            ) : canClick ? (
              <div className="h-2 w-2 rounded-full bg-white/[0.08] transition-colors group-hover:bg-gold/40" />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {canClick && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </motion.button>
  );
}

/* ──────────────────── Difficulty Button ──────────────────── */

function DifficultyButton({
  label,
  value,
  active,
  disabled,
  onClick,
}: {
  label: string;
  value: TowersDifficulty;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 rounded-lg border py-2 text-[11px] font-bold uppercase tracking-widest transition-all game-button
        ${
          active
            ? "border-gold/30 bg-gold/10 text-gold"
            : "border-white/[0.06] bg-white/[0.03] text-white/30 hover:text-white/50"
        }
        disabled:opacity-30 disabled:cursor-default
      `}
    >
      {label}
    </button>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function TowersPage() {
  const store = useTowersStore();
  const balanceStore = useBalanceStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPlaying = store.phase === "playing";
  const isGameOver = store.phase === "won" || store.phase === "lost";
  const config = {
    tilesPerRow: TILES_PER_ROW[store.difficulty],
    multipliers: MULTIPLIERS[store.difficulty],
  };

  /* ── Start Game ── */
  const handleStart = useCallback(async () => {
    setLoading(true);
    const res = await startTowersGame(
      store.betAmount,
      store.difficulty,
      store.clientSeed,
      store.nonce
    );
    setLoading(false);

    if (!res.ok) {
      alert(res.error);
      return;
    }

    balanceStore.setBalance(parseFloat(res.balance).toFixed(2));
    store.startGame(res.seedHash, res.nonce);
  }, [store, balanceStore]);

  /* ── Reveal Tile ── */
  const handleReveal = useCallback(
    async (floor: number, tileIndex: number) => {
      if (store.revealedFloors.some((r) => r.floor === floor)) return;

      const res = await revealTowersTile(floor, tileIndex, store.nonce);
      if (!res.ok) return;

      if (!res.safe) {
        store.hitTrap(res.trapPositions, res.serverSeed);
      } else {
        store.revealFloor(floor, tileIndex, res.multiplier);
      }
    },
    [store]
  );

  /* ── Cash Out ── */
  const handleCashOut = useCallback(async () => {
    if (store.currentFloor < 1) return;
    setLoading(true);

    const res = await cashOutTowers(store.currentFloor, store.nonce);
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

  /* ── Red glitch overlay on trap hit ── */
  const [showGlitch, setShowGlitch] = useState(false);
  useEffect(() => {
    if (store.phase === "lost") {
      setShowGlitch(true);
      const t = setTimeout(() => setShowGlitch(false), 800);
      return () => clearTimeout(t);
    }
  }, [store.phase]);

  /* ── Helpers for tile state ── */
  const getRevealedTile = (floor: number) =>
    store.revealedFloors.find((r) => r.floor === floor);

  const isTrapTile = (floor: number, tileIndex: number) =>
    store.trapPositions.length > 0 && store.trapPositions[floor]?.includes(tileIndex);

  const isSafeTile = (floor: number, tileIndex: number) => {
    const revealed = getRevealedTile(floor);
    return revealed?.tileIndex === tileIndex;
  };

  const isFloorRevealed = (floor: number) =>
    store.revealedFloors.some((r) => r.floor === floor) ||
    (isGameOver && store.trapPositions.length > 0);

  const isTileRevealed = (floor: number, tileIndex: number) => {
    const revealed = getRevealedTile(floor);
    if (revealed?.tileIndex === tileIndex) return true;
    if (isGameOver && store.trapPositions.length > 0 && store.trapPositions[floor]?.includes(tileIndex)) return true;
    return false;
  };

  /* ── Floor rows (bottom-to-top) ── */
  const floors = Array.from({ length: 10 }, (_, i) => i).reverse();

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
        {/* ────── Tower Grid ────── */}
        <motion.div
          variants={store.phase === "lost" ? shakeVariant : goldPulseVariant}
          animate={
            store.phase === "lost"
              ? "shake"
              : store.phase === "won"
                ? "pulse"
                : undefined
          }
        >
          <GlassPanel
            glow={store.phase === "won" ? "gold" : store.phase === "lost" ? "none" : "gold"}
            padding={false}
            className={`
              overflow-hidden p-4 sm:p-6 transition-colors duration-500 game-panel
              ${store.phase === "won" ? "border-gold/30" : ""}
              ${store.phase === "lost" ? "border-red-500/20" : ""}
            `}
          >
            {/* HUD */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-white">VOID TOWERS</span>
              </div>
              <div className="flex gap-3 font-mono text-[11px]">
                <span className="text-white/25">
                  FLOOR{" "}
                  <span className="font-bold text-gold">
                    {isPlaying || isGameOver ? `${store.currentFloor}/10` : "—"}
                  </span>
                </span>
                <span className="text-white/25">
                  MULT{" "}
                  <span
                    className={`font-bold ${
                      store.multiplier > 0 ? "text-matrix matrix-glow" : "text-white/50"
                    }`}
                  >
                    {store.multiplier > 0 ? `${store.multiplier.toFixed(2)}x` : "—"}
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

            {/* Tower Grid — bottom-to-top */}
            <div className={`mx-auto mt-4 flex max-w-md flex-col gap-2${isGameOver ? " state-locked" : ""}`}>
              {floors.map((floor) => {
                const isCurrentFloor = floor === store.currentFloor;
                const isAboveCurrent = floor > store.currentFloor;
                const floorMultiplier = config.multipliers[floor];

                return (
                  <motion.div
                    key={floor}
                    layout={false}
                    custom={9 - floor}
                    variants={floorEntryVariant}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-2"
                  >
                    {/* Floor label */}
                    <div className="flex w-14 shrink-0 flex-col items-end pr-2">
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          isCurrentFloor && isPlaying
                            ? "text-gold"
                            : floor < store.currentFloor
                              ? "text-matrix/50"
                              : "text-white/15"
                        }`}
                      >
                        F{floor + 1}
                      </span>
                      <span
                        className={`font-mono text-[9px] ${
                          floor < store.currentFloor
                            ? "text-matrix/30"
                            : isCurrentFloor && isPlaying
                              ? "text-gold/50"
                              : "text-white/10"
                        }`}
                      >
                        {floorMultiplier}x
                      </span>
                    </div>

                    {/* Tiles */}
                    <div
                      className={`grid flex-1 gap-2 ${
                        config.tilesPerRow === 2 ? "grid-cols-2" : "grid-cols-3"
                      }`}
                    >
                      {Array.from({ length: config.tilesPerRow }, (_, ti) => (
                        <TowerTile
                          key={ti}
                          floor={floor}
                          tileIndex={ti}
                          tilesPerRow={config.tilesPerRow}
                          isCurrentFloor={isCurrentFloor}
                          isRevealed={isTileRevealed(floor, ti)}
                          isSafe={isSafeTile(floor, ti)}
                          isTrap={isTrapTile(floor, ti)}
                          phase={store.phase}
                          onClick={() => handleReveal(floor, ti)}
                          isAboveCurrent={isAboveCurrent}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
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
                      <p className="text-lg font-bold text-gold">YOU CASHED OUT</p>
                      <p className="mt-1 font-mono text-2xl font-black text-matrix matrix-glow">
                        +{store.payout.toFixed(2)}
                      </p>
                      <p className="mt-1 text-[11px] text-white/20">
                        {store.multiplier.toFixed(2)}x multiplier &middot; Floor {store.currentFloor}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-red-400">TRAP HIT</p>
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
          {/* Game Setup */}
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30 game-button"
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30 game-button"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Difficulty
              </label>
              <div className="flex gap-2">
                <DifficultyButton
                  label="Easy"
                  value="easy"
                  active={store.difficulty === "easy"}
                  disabled={isPlaying}
                  onClick={() => store.setDifficulty("easy")}
                />
                <DifficultyButton
                  label="Medium"
                  value="medium"
                  active={store.difficulty === "medium"}
                  disabled={isPlaying}
                  onClick={() => store.setDifficulty("medium")}
                />
                <DifficultyButton
                  label="Hard"
                  value="hard"
                  active={store.difficulty === "hard"}
                  disabled={isPlaying}
                  onClick={() => store.setDifficulty("hard")}
                />
              </div>
            </div>

            {/* Next Floor Multiplier Preview */}
            {isPlaying && store.currentFloor < 10 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-center"
              >
                <p className="text-[10px] text-white/20">NEXT FLOOR</p>
                <p className="font-mono text-lg font-bold text-gold">
                  {config.multipliers[store.currentFloor].toFixed(2)}x
                </p>
                <p className="text-[10px] text-white/15">
                  Potential: {(store.betAmount * config.multipliers[store.currentFloor]).toFixed(2)} RC
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            {store.phase === "idle" || isGameOver ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={isGameOver ? store.reset : handleStart}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-xs font-bold uppercase tracking-widest text-obsidian cta-glow transition-all disabled:opacity-50 game-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isGameOver ? (
                  "NEW GAME"
                ) : (
                  <>
                    <Building2 className="h-3.5 w-3.5" />
                    CLIMB TOWER
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCashOut}
                disabled={loading || store.currentFloor < 1}
                animate={{
                  boxShadow: store.currentFloor >= 1
                    ? [
                        "0 0 0px rgba(0,255,65,0)",
                        "0 0 20px rgba(0,255,65,0.2)",
                        "0 0 0px rgba(0,255,65,0)",
                      ]
                    : "none",
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-matrix/20 bg-matrix/10 py-3 text-xs font-bold uppercase tracking-widest text-matrix transition-all hover:bg-matrix/15 disabled:opacity-30 game-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <HandCoins className="h-3.5 w-3.5" />
                    CASH OUT
                    {store.currentFloor >= 1 && (
                      <span className="ml-1">
                        ({(store.betAmount * config.multipliers[store.currentFloor - 1]).toFixed(2)})
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            )}
          </GlassPanel>

          {/* Provably Fair Panel */}
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
                    className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5 text-white/20 transition-colors hover:text-white/50 game-button"
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
