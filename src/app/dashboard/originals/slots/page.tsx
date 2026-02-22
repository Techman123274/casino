"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import { useSlotsStore } from "@/stores/slots-store";
import { useBalanceStore } from "@/stores/balance-store";
import { spinSlots } from "./slots-action";

const SYMBOL_EMOJIS = ["🌿", "💻", "🥇", "🗡️", "7️⃣", "⭐"];
const SYMBOL_NAMES = ["Leaf", "Terminal", "Gold Bar", "Dagger", "Seven", "Wild"];

const COLS = 5;
const ROWS = 3;
const CELL_W = 90;
const CELL_H = 80;
const GAP = 4;
const CANVAS_W = COLS * CELL_W + (COLS - 1) * GAP;
const CANVAS_H = ROWS * CELL_H + (ROWS - 1) * GAP;

const PAYLINE_PATHS: [number, number][][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
  [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
  [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
  [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]],
  [[0, 1], [1, 2], [2, 1], [3, 2], [4, 1]],
  [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]],
  [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1]],
];

const PAYLINE_COLORS = [
  "#FFD700", "#00FF41", "#FF6B6B", "#00BFFF", "#FF69B4",
  "#FFA500", "#7B68EE", "#40E0D0", "#FF4500",
];

function getCellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * (CELL_W + GAP) + CELL_W / 2,
    y: row * (CELL_H + GAP) + CELL_H / 2,
  };
}

function drawSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: number,
  cx: number,
  cy: number,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "36px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(SYMBOL_EMOJIS[symbol], cx, cy);
  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: number[][],
  w: number,
  h: number,
  dpr: number,
  winningLines: number[],
  flashPhase: boolean
) {
  ctx.clearRect(0, 0, w, h);

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const x = col * (CELL_W + GAP);
      const y = row * (CELL_H + GAP);

      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.beginPath();
      ctx.roundRect(x, y, CELL_W, CELL_H, 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, CELL_W, CELL_H, 8);
      ctx.stroke();

      const { x: cx, y: cy } = getCellCenter(col, row);
      drawSymbol(ctx, grid[col][row], cx, cy);
    }
  }

  if (winningLines.length > 0 && flashPhase) {
    for (const lineIdx of winningLines) {
      const path = PAYLINE_PATHS[lineIdx];
      const color = PAYLINE_COLORS[lineIdx % PAYLINE_COLORS.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();

      for (let i = 0; i < path.length; i++) {
        const { x, y } = getCellCenter(path[i][0], path[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (const [col, row] of path) {
        const { x, y } = getCellCenter(col, row);
        ctx.fillStyle = color + "40";
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawSpinningReel(
  ctx: CanvasRenderingContext2D,
  col: number,
  offset: number,
  blur: number
) {
  const x = col * (CELL_W + GAP);

  ctx.save();

  ctx.fillStyle = "rgba(2,2,2,0.95)";
  ctx.beginPath();
  ctx.roundRect(x, 0, CELL_W, CANVAS_H, 8);
  ctx.fill();
  ctx.clip();

  if (blur > 0) {
    ctx.filter = `blur(${Math.min(blur, 4)}px)`;
  }

  for (let row = -1; row <= ROWS + 1; row++) {
    const sym = Math.floor(Math.random() * 6);
    const cy = row * (CELL_H + GAP) + CELL_H / 2 + (offset % (CELL_H + GAP));
    if (cy > -CELL_H && cy < CANVAS_H + CELL_H) {
      drawSymbol(ctx, sym, x + CELL_W / 2, cy, 0.6);
    }
  }

  ctx.restore();
}

export default function SlotsPage() {
  const store = useSlotsStore();
  const balanceStore = useBalanceStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scatterFlash, setScatterFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const reelStopTimes = useRef<number[]>([0, 0, 0, 0, 0]);
  const spinStartTime = useRef(0);
  const finalGrid = useRef<number[][] | null>(null);
  const reelsStopped = useRef<boolean[]>([true, true, true, true, true]);
  const flashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [flashPhase, setFlashPhase] = useState(false);

  const winningLineIndices = store.paylines.map((p) => p.line - 1);

  useEffect(() => {
    if (winningLineIndices.length > 0) {
      flashTimerRef.current = setInterval(() => {
        setFlashPhase((prev) => !prev);
      }, 400);
    } else {
      setFlashPhase(false);
      if (flashTimerRef.current) {
        clearInterval(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    }
    return () => {
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
    };
  }, [winningLineIndices.length]);

  const drawStaticGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    drawGrid(ctx, store.grid, CANVAS_W, CANVAS_H, dpr, winningLineIndices, flashPhase);
  }, [store.grid, winningLineIndices, flashPhase]);

  useEffect(() => {
    if (!store.spinning) {
      drawStaticGrid();
    }
  }, [store.spinning, drawStaticGrid]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
    };
  }, []);

  const startSpinAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    const SPIN_DURATION = 1200;
    const REEL_DELAY = 200;
    spinStartTime.current = performance.now();
    reelsStopped.current = [false, false, false, false, false];

    for (let i = 0; i < COLS; i++) {
      reelStopTimes.current[i] = SPIN_DURATION + i * REEL_DELAY;
    }

    const animate = (now: number) => {
      const elapsed = now - spinStartTime.current;
      const totalDuration = SPIN_DURATION + (COLS - 1) * REEL_DELAY + 300;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      for (let col = 0; col < COLS; col++) {
        const stopTime = reelStopTimes.current[col];
        const reelElapsed = elapsed;

        if (reelElapsed >= stopTime && finalGrid.current) {
          reelsStopped.current[col] = true;
          for (let row = 0; row < ROWS; row++) {
            const x = col * (CELL_W + GAP);
            const y = row * (CELL_H + GAP);

            ctx.fillStyle = "rgba(255,255,255,0.02)";
            ctx.beginPath();
            ctx.roundRect(x, y, CELL_W, CELL_H, 8);
            ctx.fill();

            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, CELL_W, CELL_H, 8);
            ctx.stroke();

            const { x: cx, y: cy } = getCellCenter(col, row);
            drawSymbol(ctx, finalGrid.current[col][row], cx, cy);
          }
        } else {
          const speed = Math.max(0.3, 1 - (reelElapsed / stopTime) * 0.7);
          const offset = (reelElapsed * speed * 0.8) % (CELL_H + GAP);
          const blur = speed > 0.7 ? 4 : speed > 0.4 ? 2 : 0;
          drawSpinningReel(ctx, col, offset, blur);
        }
      }

      if (elapsed < totalDuration) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (finalGrid.current) {
          drawGrid(ctx, finalGrid.current, CANVAS_W, CANVAS_H, dpr, [], false);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleSpin = useCallback(async () => {
    setLoading(true);
    store.startSpin();
    finalGrid.current = null;
    setScatterFlash(false);

    startSpinAnimation();

    const res = await spinSlots(store.betAmount, store.clientSeed);

    if (!res.ok) {
      setLoading(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      store.reset();
      alert(res.error);
      return;
    }

    finalGrid.current = res.grid;

    const waitForReels = new Promise<void>((resolve) => {
      const totalWait =
        1200 + (COLS - 1) * 200 + 400;
      setTimeout(resolve, totalWait);
    });

    await waitForReels;

    balanceStore.setBalance(res.balance);
    store.finishSpin({
      grid: res.grid,
      paylines: res.paylines,
      totalPayout: res.totalPayout,
      scatterCount: res.scatterCount,
      isScatterWin: res.isScatterWin,
      serverSeed: res.serverSeed,
      seedHash: res.seedHash,
    });

    if (res.isScatterWin) {
      setScatterFlash(true);
      setTimeout(() => setScatterFlash(false), 1500);
    }

    setLoading(false);
  }, [store, balanceStore, startSpinAnimation]);

  const copySeedHash = () => {
    navigator.clipboard.writeText(store.seedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative min-h-full p-4 sm:p-6">
      {/* Scatter win background flash */}
      <AnimatePresence>
        {scatterFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,255,65,0.15) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

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

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Slot Machine ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassPanel
            glow={store.totalPayout > 0 ? "gold" : "none"}
            padding={false}
            className={`scanline-overlay overflow-hidden p-4 sm:p-6 game-panel transition-colors duration-500 ${
              store.totalPayout > 0 ? "border-gold/30" : ""
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-white">CYBER SLOTS</span>
              </div>
              {store.totalPayout > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-mono text-sm font-bold text-matrix"
                >
                  +{store.totalPayout.toFixed(2)} RC
                </motion.div>
              )}
            </div>

            <div className="h-px w-full bg-white/[0.04]" />

            {/* Canvas Grid */}
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="game-canvas rounded-xl"
                  style={{ width: CANVAS_W, height: CANVAS_H }}
                />
                {/* Scanline effect overlay */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
                  }}
                />
              </div>
            </div>

            {/* Payline legend */}
            {store.paylines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex flex-wrap justify-center gap-2"
              >
                {store.paylines.map((pl) => (
                  <div
                    key={pl.line}
                    className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1 font-mono text-[10px]"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          PAYLINE_COLORS[(pl.line - 1) % PAYLINE_COLORS.length],
                      }}
                    />
                    <span className="text-white/40">L{pl.line}</span>
                    <span className="font-bold text-gold">
                      +{pl.payout.toFixed(2)}
                    </span>
                  </div>
                ))}
                {store.isScatterWin && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-matrix/20 bg-matrix/5 px-2.5 py-1 font-mono text-[10px]">
                    <span className="text-matrix">🌿 SCATTER x3</span>
                  </div>
                )}
              </motion.div>
            )}
          </GlassPanel>
        </motion.div>

        {/* ── Controls Sidebar ── */}
        <div className="flex flex-col gap-4">
          <GlassPanel glow="none" className="neon-border p-5 game-panel">
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
                  disabled={store.spinning}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={store.betAmount}
                  onChange={(e) =>
                    store.setBetAmount(parseFloat(e.target.value) || 0)
                  }
                  disabled={store.spinning}
                  className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-white/70 outline-none transition-colors focus:border-gold/20 disabled:opacity-50"
                  step="0.01"
                  min="0.01"
                />
                <button
                  onClick={() => store.setBetAmount(store.betAmount * 2)}
                  disabled={store.spinning}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Symbol Legend */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Symbols
              </label>
              <div className="grid grid-cols-3 gap-1">
                {SYMBOL_EMOJIS.map((emoji, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2 py-1 text-[10px]"
                  >
                    <span>{emoji}</span>
                    <span className="text-white/30">{SYMBOL_NAMES[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spin Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSpin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-xs font-bold uppercase tracking-widest text-obsidian cta-glow game-button transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  SPIN
                </>
              )}
            </motion.button>
          </GlassPanel>

          {/* History */}
          {store.history.length > 0 && (
            <GlassPanel glow="none" className="p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/30">
                Recent Spins
              </h3>
              <div className="space-y-1.5">
                {store.history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 font-mono text-[11px]"
                  >
                    <span className="text-white/30">
                      {h.betAmount.toFixed(2)} RC
                    </span>
                    <span className="text-white/20">
                      {h.paylines.length > 0 ? `${h.paylines.length} lines` : "—"}
                    </span>
                    <span
                      className={`font-bold ${
                        h.totalPayout > 0 ? "text-matrix" : "text-red-400/50"
                      }`}
                    >
                      {h.totalPayout > 0
                        ? `+${h.totalPayout.toFixed(2)}`
                        : `-${h.betAmount.toFixed(2)}`}
                    </span>
                    {h.isScatterWin && (
                      <span className="text-[9px] text-matrix">🌿</span>
                    )}
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Provably Fair */}
          <GlassPanel glow="none" className="p-5 game-panel">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold/50" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">
                Provably Fair
              </h3>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-[10px] text-white/20">
                Server Seed Hash
              </label>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 truncate rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/30">
                  {store.seedHash || "—"}
                </code>
                {store.seedHash && (
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

            <AnimatePresence>
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
            </AnimatePresence>

            <div className="mt-3">
              <label className="mb-1 block text-[10px] text-white/20">
                Client Seed
              </label>
              <input
                type="text"
                value={store.clientSeed}
                onChange={(e) => store.setClientSeed(e.target.value)}
                disabled={store.spinning}
                className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/40 outline-none transition-colors focus:border-gold/20 disabled:opacity-40"
              />
            </div>

            <p className="mt-3 text-[9px] leading-relaxed text-white/10">
              Each spin is derived from HMAC-SHA256(serverSeed, clientSeed:nonce).
              Grid positions use 2 hex chars each (15 positions = 30 hex chars).
              Verify: SHA-256(serverSeed) === seedHash.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
