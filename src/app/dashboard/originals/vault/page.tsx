"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Skull,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import {
  useVaultStore,
  VAULT_MULTIPLIERS,
  VAULT_FLOORS,
  NODES_PER_FLOOR,
  type VaultPhase,
} from "@/stores/vault-store";
import { useBalanceStore } from "@/stores/balance-store";
import { startVaultHack, hackNode, extractLoot } from "./vault-action";

/* ──────────────────── Animations ──────────────────── */

const nodeFlipVariants = {
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

/* ──────────────────── Node Labels ──────────────────── */

const NODE_COMMANDS = [
  ["./decrypt_a", "./decrypt_b", "./decrypt_c"],
  ["./bypass_fw1", "./bypass_fw2", "./bypass_fw3"],
  ["./inject_0x1", "./inject_0x2", "./inject_0x3"],
  ["./crack_hash", "./crack_salt", "./crack_key"],
  ["./tunnel_ssh", "./tunnel_vpn", "./tunnel_tor"],
  ["./dump_mem_a", "./dump_mem_b", "./dump_mem_c"],
  ["./root_kit_1", "./root_kit_2", "./root_kit_3"],
  ["./vault_open", "./vault_brut", "./vault_keys"],
];

/* ──────────────────── Node Component ──────────────────── */

function VaultNode({
  floor,
  nodeIndex,
  isCurrentFloor,
  isRevealed,
  isSafe,
  isTrap,
  phase,
  onClick,
  isAboveCurrent,
}: {
  floor: number;
  nodeIndex: number;
  isCurrentFloor: boolean;
  isRevealed: boolean;
  isSafe: boolean;
  isTrap: boolean;
  phase: VaultPhase;
  onClick: () => void;
  isAboveCurrent: boolean;
}) {
  const isGameOver = phase === "breached" || phase === "busted";
  const canClick = phase === "hacking" && isCurrentFloor && !isRevealed;

  return (
    <motion.button
      whileHover={canClick ? { scale: 1.05, y: -2 } : {}}
      whileTap={canClick ? { scale: 0.93 } : {}}
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={`
        group relative overflow-hidden rounded-lg border backdrop-blur-md
        transition-all duration-300 h-14 sm:h-16 font-mono
        ${
          isRevealed
            ? isTrap
              ? "border-red-500/30 bg-red-500/10"
              : "border-matrix/20 bg-matrix/[0.06]"
            : canClick
              ? "border-matrix/20 bg-white/[0.04] hover:border-matrix/40 hover:bg-white/[0.08] cursor-pointer"
              : isAboveCurrent && !isGameOver
                ? "border-white/[0.03] bg-white/[0.015] cursor-default opacity-30"
                : "border-white/[0.06] bg-white/[0.02] cursor-default"
        }
        ${isGameOver && !isRevealed ? "opacity-25" : ""}
        game-tile
      `}
      style={{ perspective: "600px" }}
    >
      {canClick && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-lg border border-matrix/30"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <AnimatePresence mode="wait">
        {isRevealed ? (
          <motion.div
            key="revealed"
            variants={nodeFlipVariants}
            initial="hidden"
            animate="visible"
            className="flex h-full w-full flex-col items-center justify-center gap-0.5"
          >
            {isTrap ? (
              <>
                <Skull className="h-4 w-4 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-red-400/80">
                  FIREWALL
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-matrix drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-matrix/80">
                  ACCESS
                </span>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hidden"
            exit={{ rotateY: 90, opacity: 0, transition: { duration: 0.15 } }}
            className="flex h-full w-full flex-col items-center justify-center gap-0.5"
          >
            {isAboveCurrent && !isGameOver ? (
              <>
                <Lock className="h-3 w-3 text-white/[0.08]" />
                <span className="text-[7px] text-white/[0.06] uppercase tracking-wider">
                  LOCKED
                </span>
              </>
            ) : canClick ? (
              <span className="text-[9px] text-matrix/40 transition-colors group-hover:text-matrix/70">
                {NODE_COMMANDS[floor]?.[nodeIndex] ?? `./node_${nodeIndex}`}
              </span>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {canClick && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-matrix/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </motion.button>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function VaultPage() {
  const store = useVaultStore();
  const balanceStore = useBalanceStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHacking = store.phase === "hacking";
  const isGameOver = store.phase === "breached" || store.phase === "busted";

  /* ── Start Hack ── */
  const handleStart = useCallback(async () => {
    setLoading(true);
    const res = await startVaultHack(
      store.betAmount,
      store.clientSeed,
      store.nonce
    );
    setLoading(false);

    if (!res.ok) {
      alert(res.error);
      return;
    }

    balanceStore.setBalance(parseFloat(res.balance).toFixed(2));
    store.startHack(res.seedHash, res.nonce);
  }, [store, balanceStore]);

  /* ── Hack Node ── */
  const handleHack = useCallback(
    async (floor: number, nodeIndex: number) => {
      if (store.revealedFloors.some((r) => r.floor === floor)) return;

      const res = await hackNode(floor, nodeIndex, store.nonce);
      if (!res.ok) return;

      if (!res.safe) {
        store.hitFirewall(res.trapPositions, res.serverSeed);
      } else {
        store.revealNode(floor, nodeIndex, res.multiplier);
      }
    },
    [store]
  );

  /* ── Extract Loot ── */
  const handleExtract = useCallback(async () => {
    if (store.currentFloor < 1) return;
    setLoading(true);

    const res = await extractLoot(store.currentFloor, store.nonce);
    setLoading(false);

    if (!res.ok) {
      alert(res.error);
      return;
    }

    balanceStore.setBalance(parseFloat(res.balance).toFixed(2));
    store.extractLoot(res.payout, res.serverSeed);
  }, [store, balanceStore]);

  /* ── Copy seed hash ── */
  const copySeedHash = () => {
    navigator.clipboard.writeText(store.serverSeedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ── Red glitch overlay on firewall hit ── */
  const [showGlitch, setShowGlitch] = useState(false);
  useEffect(() => {
    if (store.phase === "busted") {
      setShowGlitch(true);
      const t = setTimeout(() => setShowGlitch(false), 800);
      return () => clearTimeout(t);
    }
  }, [store.phase]);

  /* ── Node state helpers ── */
  const getRevealedNode = (floor: number) =>
    store.revealedFloors.find((r) => r.floor === floor);

  const isTrapNode = (floor: number, nodeIndex: number) =>
    store.trapPositions.length > 0 && store.trapPositions[floor] === nodeIndex;

  const isSafeNode = (floor: number, nodeIndex: number) => {
    const revealed = getRevealedNode(floor);
    return revealed?.nodeIndex === nodeIndex;
  };

  const isNodeRevealed = (floor: number, nodeIndex: number) => {
    const revealed = getRevealedNode(floor);
    if (revealed?.nodeIndex === nodeIndex) return true;
    if (isGameOver && store.trapPositions.length > 0 && store.trapPositions[floor] === nodeIndex) return true;
    return false;
  };

  /* ── Floor rows (bottom-to-top) ── */
  const floors = Array.from({ length: VAULT_FLOORS }, (_, i) => i).reverse();
  const energyPercent = (store.currentFloor / VAULT_FLOORS) * 100;

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
        {/* ────── Vault Grid ────── */}
        <motion.div
          variants={store.phase === "busted" ? shakeVariant : goldPulseVariant}
          animate={
            store.phase === "busted"
              ? "shake"
              : store.phase === "breached"
                ? "pulse"
                : undefined
          }
        >
          <GlassPanel
            glow={store.phase === "breached" ? "gold" : store.phase === "busted" ? "none" : "gold"}
            padding={false}
            className={`
              overflow-hidden p-4 sm:p-6 transition-colors duration-500 game-panel neon-border scanline-overlay
              ${store.phase === "breached" ? "border-gold/30" : ""}
              ${store.phase === "busted" ? "border-red-500/20" : ""}
            `}
          >
            {/* HUD */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-matrix" />
                <span className="font-mono text-sm font-bold text-matrix tracking-wider">
                  HACK-THE-VAULT
                </span>
              </div>
              <div className="flex gap-3 font-mono text-[11px]">
                <span className="text-white/25">
                  FLOOR{" "}
                  <span className="font-bold text-matrix">
                    {isHacking || isGameOver ? `${store.currentFloor}/${VAULT_FLOORS}` : "—"}
                  </span>
                </span>
                <span className="text-white/25">
                  MULT{" "}
                  <span
                    className={`font-bold ${
                      store.multiplier > 0 ? "text-gold gold-glow" : "text-white/50"
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

            {/* Hacker Energy Bar */}
            {(isHacking || isGameOver) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-matrix" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-matrix/60">
                      Hacker Energy
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-matrix/40">
                    {store.currentFloor}/{VAULT_FLOORS}
                  </span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-matrix/60 to-matrix"
                    initial={{ width: 0 }}
                    animate={{ width: `${energyPercent}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    style={{
                      boxShadow: "0 0 12px rgba(0,255,65,0.4), 0 0 24px rgba(0,255,65,0.15)",
                    }}
                  />
                </div>
              </motion.div>
            )}

            <div className="h-px w-full bg-white/[0.04]" />

            {/* Vault Grid — bottom-to-top */}
            <div className={`mx-auto mt-4 flex max-w-md flex-col gap-2${isGameOver ? " state-locked" : ""}`}>
              {floors.map((floor) => {
                const isCurrentFloor = floor === store.currentFloor;
                const isAboveCurrent = floor > store.currentFloor;
                const floorMultiplier = VAULT_MULTIPLIERS[floor];
                const useGlitch = floor >= 5;

                return (
                  <motion.div
                    key={floor}
                    layout={false}
                    custom={VAULT_FLOORS - 1 - floor}
                    variants={floorEntryVariant}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-2"
                  >
                    {/* Floor label */}
                    <div className="flex w-16 shrink-0 flex-col items-end pr-2">
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          useGlitch ? "glitch-text" : ""
                        } ${
                          isCurrentFloor && isHacking
                            ? "text-matrix"
                            : floor < store.currentFloor
                              ? "text-matrix/50"
                              : "text-white/15"
                        }`}
                      >
                        L{floor + 1}
                      </span>
                      <span
                        className={`font-mono text-[9px] ${
                          floor < store.currentFloor
                            ? "text-gold/40"
                            : isCurrentFloor && isHacking
                              ? "text-gold/50"
                              : "text-white/10"
                        }`}
                      >
                        {floorMultiplier}x
                      </span>
                    </div>

                    {/* Nodes */}
                    <div className="grid flex-1 grid-cols-3 gap-2">
                      {Array.from({ length: NODES_PER_FLOOR }, (_, ni) => (
                        <VaultNode
                          key={ni}
                          floor={floor}
                          nodeIndex={ni}
                          isCurrentFloor={isCurrentFloor}
                          isRevealed={isNodeRevealed(floor, ni)}
                          isSafe={isSafeNode(floor, ni)}
                          isTrap={isTrapNode(floor, ni)}
                          phase={store.phase}
                          onClick={() => handleHack(floor, ni)}
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
                  className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center font-mono"
                >
                  {store.phase === "breached" ? (
                    <>
                      <p className="text-lg font-bold text-gold tracking-widest">
                        {">"} VAULT BREACHED
                      </p>
                      <p className="mt-1 text-2xl font-black text-matrix matrix-glow">
                        +{store.payout.toFixed(2)} RC
                      </p>
                      <p className="mt-1 text-[11px] text-white/20">
                        {store.multiplier.toFixed(2)}x multiplier &middot; Floor {store.currentFloor}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-red-400 tracking-widest">
                        {">"} FIREWALL DETECTED
                      </p>
                      <p className="mt-1 text-2xl font-black text-red-400/70">
                        −{store.betAmount.toFixed(2)} RC
                      </p>
                      <p className="mt-1 text-[10px] text-red-400/30">
                        CONNECTION TERMINATED
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
          <GlassPanel glow="none" className="p-5 game-panel neon-border">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-matrix/40 font-mono">
              <Terminal className="h-3.5 w-3.5" />
              Terminal
            </h3>

            {/* Bet Amount */}
            <div className="mb-4">
              <label className="mb-1.5 block font-mono text-[11px] font-medium text-white/25">
                {">"} wager_amount
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => store.setBetAmount(store.betAmount / 2)}
                  disabled={isHacking}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30 game-button"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={store.betAmount}
                  onChange={(e) => store.setBetAmount(parseFloat(e.target.value) || 0)}
                  disabled={isHacking}
                  className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-matrix/70 outline-none transition-colors focus:border-matrix/20 disabled:opacity-50"
                  step="0.01"
                  min="0.01"
                />
                <button
                  onClick={() => store.setBetAmount(store.betAmount * 2)}
                  disabled={isHacking}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30 game-button"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Next Floor Preview */}
            {isHacking && store.currentFloor < VAULT_FLOORS && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 rounded-lg border border-matrix/10 bg-matrix/[0.03] p-3 text-center font-mono"
              >
                <p className="text-[10px] text-matrix/30">NEXT LEVEL REWARD</p>
                <p className="text-lg font-bold text-gold">
                  {VAULT_MULTIPLIERS[store.currentFloor].toFixed(2)}x
                </p>
                <p className="text-[10px] text-white/15">
                  Potential: {(store.betAmount * VAULT_MULTIPLIERS[store.currentFloor]).toFixed(2)} RC
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 font-mono text-xs font-bold uppercase tracking-widest text-obsidian cta-glow transition-all disabled:opacity-50 game-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isGameOver ? (
                  "RECONNECT"
                ) : (
                  <>
                    <Terminal className="h-3.5 w-3.5" />
                    START HACK
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExtract}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-matrix/20 bg-matrix/10 py-3 font-mono text-xs font-bold uppercase tracking-widest text-matrix transition-all hover:bg-matrix/15 disabled:opacity-30 game-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    EXTRACT LOOT
                    {store.currentFloor >= 1 && (
                      <span className="ml-1">
                        ({(store.betAmount * VAULT_MULTIPLIERS[store.currentFloor - 1]).toFixed(2)})
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
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/30">
                Provably Fair
              </h3>
            </div>

            {/* Seed Hash */}
            <div className="mb-3">
              <label className="mb-1 block font-mono text-[10px] text-white/20">
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
                <label className="mb-1 block font-mono text-[10px] text-white/20">
                  Server Seed (revealed)
                </label>
                <code className="block truncate rounded-lg border border-matrix/10 bg-matrix/[0.03] px-2.5 py-1.5 font-mono text-[10px] text-matrix/50">
                  {store.serverSeed}
                </code>
              </motion.div>
            )}

            {/* Client Seed */}
            <div className="mt-3">
              <label className="mb-1 block font-mono text-[10px] text-white/20">
                Client Seed
              </label>
              <input
                type="text"
                value={store.clientSeed}
                onChange={(e) => store.setClientSeed(e.target.value)}
                disabled={isHacking}
                className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/40 outline-none transition-colors focus:border-matrix/20 disabled:opacity-40"
              />
            </div>

            <p className="mt-3 font-mono text-[9px] leading-relaxed text-white/10">
              SHA-256 hash is displayed before the hack begins. After the session
              ends, the raw seed is revealed for verification.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
