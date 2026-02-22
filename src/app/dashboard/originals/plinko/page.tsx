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
  CircleDot,
  History,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import { usePlinkoStore, type PlinkoRisk } from "@/stores/plinko-store";
import { lerp, damp, TICK_INTERVAL_MS } from "@/lib/perf";
import { useBalanceStore } from "@/stores/balance-store";
import { playPlinko } from "./plinko-action";

/* ──────────────────── Multiplier tables (mirrored from server for bucket labels) ──────────────────── */

const MULTIPLIERS: Record<number, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

/* ──────────────────── Canvas helpers ──────────────────── */

const GOLD = "#FFD700";
const MATRIX = "#00FF41";
const BG = "#020202";
const PIN_RADIUS = 3;
const BALL_RADIUS = 7;

function bucketColor(mult: number): string {
  if (mult >= 10) return GOLD;
  if (mult >= 2) return "#FF8C00";
  if (mult >= 1) return "#888";
  return "#FF4444";
}

interface PinLayout {
  pins: { x: number; y: number }[][];
  bucketCenters: { x: number; y: number }[];
  width: number;
  height: number;
  startX: number;
  startY: number;
  spacingX: number;
  spacingY: number;
}

function computeLayout(rows: number, canvasW: number, canvasH: number): PinLayout {
  const topPad = 40;
  const bottomPad = 50;
  const sidePad = 30;

  const spacingY = (canvasH - topPad - bottomPad) / (rows + 1);
  const spacingX = (canvasW - sidePad * 2) / (rows + 1);

  const pins: { x: number; y: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowPins: { x: number; y: number }[] = [];
    const count = r + 3;
    const rowWidth = (count - 1) * spacingX;
    const offsetX = (canvasW - rowWidth) / 2;
    const y = topPad + (r + 1) * spacingY;
    for (let c = 0; c < count; c++) {
      rowPins.push({ x: offsetX + c * spacingX, y });
    }
    pins.push(rowPins);
  }

  const bucketCount = rows + 1;
  const bucketRowWidth = (bucketCount - 1) * spacingX;
  const bucketOffsetX = (canvasW - bucketRowWidth) / 2;
  const bucketY = topPad + (rows + 1) * spacingY;
  const bucketCenters: { x: number; y: number }[] = [];
  for (let i = 0; i < bucketCount; i++) {
    bucketCenters.push({ x: bucketOffsetX + i * spacingX, y: bucketY });
  }

  return {
    pins,
    bucketCenters,
    width: canvasW,
    height: canvasH,
    startX: canvasW / 2,
    startY: topPad - 10,
    spacingX,
    spacingY,
  };
}

/* ──────────────────── Main Page ──────────────────── */

export default function PlinkoPage() {
  const store = usePlinkoStore();
  const balanceStore = useBalanceStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [landedBucket, setLandedBucket] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const ballPosRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);

  const currentMultipliers = MULTIPLIERS[store.rows][store.risk];

  /* ── Draw static board ── */
  const drawBoard = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      layout: PinLayout,
      highlightBucket: number | null
    ) => {
      const { width, height, pins, bucketCenters } = layout;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = GOLD;
      ctx.beginPath();
      for (const row of pins) {
        for (const pin of row) {
          const px = pin.x | 0;
          const py = pin.y | 0;
          ctx.moveTo(px + PIN_RADIUS, py);
          ctx.arc(px, py, PIN_RADIUS, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      ctx.save();
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (const row of pins) {
        for (const pin of row) {
          const px = pin.x | 0;
          const py = pin.y | 0;
          ctx.moveTo(px + PIN_RADIUS, py);
          ctx.arc(px, py, PIN_RADIUS, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.restore();

      const mults = MULTIPLIERS[store.rows][store.risk];
      const bucketW = layout.spacingX * 0.85;
      const bucketH = 28;
      for (let i = 0; i < bucketCenters.length; i++) {
        const bc = bucketCenters[i];
        const col = bucketColor(mults[i]);
        const isHit = highlightBucket === i;

        ctx.fillStyle = isHit ? col : col + "33";
        ctx.strokeStyle = col + "66";
        ctx.lineWidth = 1;

        const rx = (bc.x - bucketW / 2) | 0;
        const ry = (bc.y - bucketH / 2) | 0;
        const radius = 4;

        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + bucketW - radius, ry);
        ctx.quadraticCurveTo(rx + bucketW, ry, rx + bucketW, ry + radius);
        ctx.lineTo(rx + bucketW, ry + bucketH - radius);
        ctx.quadraticCurveTo(rx + bucketW, ry + bucketH, rx + bucketW - radius, ry + bucketH);
        ctx.lineTo(rx + radius, ry + bucketH);
        ctx.quadraticCurveTo(rx, ry + bucketH, rx, ry + bucketH - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (isHit) {
          ctx.save();
          ctx.shadowColor = col;
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = isHit ? BG : "#fff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = mults[i] >= 100 ? `${mults[i]}` : `${mults[i]}x`;
        ctx.fillText(label, bc.x | 0, bc.y | 0);
      }
    },
    [store.rows, store.risk]
  );

  /* ── Animate ball drop ── */
  const animateDrop = useCallback(
    (path: number[], bucket: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const canvasW = canvas.width / dpr;
      const canvasH = canvas.height / dpr;
      const layout = computeLayout(store.rows, canvasW, canvasH);

      const waypoints: { x: number; y: number }[] = [
        { x: layout.startX, y: layout.startY },
      ];

      let posX = layout.startX;
      for (let r = 0; r < path.length; r++) {
        const rowPins = layout.pins[r];
        const rowCenter = rowPins[0].x + ((rowPins.length - 1) * layout.spacingX) / 2;
        const relativeX = posX - rowCenter;
        const pinIndex = Math.round(relativeX / layout.spacingX + (rowPins.length - 1) / 2);
        const clampedIdx = Math.max(0, Math.min(rowPins.length - 1, pinIndex));

        const pin = rowPins[clampedIdx];
        const dir = path[r] === 1 ? 1 : -1;
        const jitter = (Math.random() - 0.5) * 4;
        const nextX = pin.x + dir * (layout.spacingX / 2) + jitter;
        posX = nextX;

        waypoints.push({ x: nextX, y: pin.y + layout.spacingY * 0.3 });
      }

      const targetBucket = layout.bucketCenters[bucket];
      if (targetBucket) {
        waypoints.push({ x: targetBucket.x, y: targetBucket.y });
      }

      const totalSteps = waypoints.length - 1;
      const DAMP_MS = 100;
      const SNAP_THRESHOLD = 1.5;
      let currentStep = 0;

      ballPosRef.current = { x: waypoints[0].x, y: waypoints[0].y };
      lastTimeRef.current = performance.now();
      trailRef.current = [];

      const tick = (now: number) => {
        const dt = now - lastTimeRef.current;
        lastTimeRef.current = now;

        const target = waypoints[currentStep + 1];
        ballPosRef.current.x = damp(ballPosRef.current.x, target.x, DAMP_MS, dt);
        ballPosRef.current.y = damp(ballPosRef.current.y, target.y, DAMP_MS, dt);

        const dx = target.x - ballPosRef.current.x;
        const dy = target.y - ballPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SNAP_THRESHOLD && currentStep < totalSteps - 1) {
          currentStep++;
        }

        const ballX = ballPosRef.current.x | 0;
        const ballY = ballPosRef.current.y | 0;
        const isLast = currentStep >= totalSteps - 1 && dist < SNAP_THRESHOLD;

        trailRef.current.push({ x: ballX, y: ballY, alpha: 1 });
        if (trailRef.current.length > 20) trailRef.current.shift();

        drawBoard(ctx, layout, isLast ? bucket : null);

        for (const dot of trailRef.current) {
          ctx.beginPath();
          ctx.arc(dot.x | 0, dot.y | 0, BALL_RADIUS * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 215, 0, ${dot.alpha * 0.3})`;
          ctx.fill();
          dot.alpha *= 0.88;
        }

        ctx.beginPath();
        ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = GOLD;
        ctx.fill();
        ctx.save();
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();

        if (isLast) {
          setLandedBucket(bucket);
          store.finishDrop();
          animFrameRef.current = 0;
          return;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [store, drawBoard]
  );

  /* ── Resize & draw static board ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const layout = computeLayout(store.rows, w, h);
      drawBoard(ctx, layout, landedBucket);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      trailRef.current = [];
    };
  }, [store.rows, store.risk, drawBoard, landedBucket]);

  /* ── Play ── */
  const handleDrop = useCallback(async () => {
    setLoading(true);
    setLandedBucket(null);
    store.reset();

    const res = await playPlinko(store.betAmount, store.risk, store.rows);
    setLoading(false);

    if (!res.ok) {
      alert(res.error);
      return;
    }

    balanceStore.setBalance(res.balance);
    store.startDrop(
      res.path,
      res.bucket,
      res.multiplier,
      res.payout,
      res.serverSeed,
      res.seedHash
    );

    animateDrop(res.path, res.bucket);
  }, [store, balanceStore, animateDrop]);

  /* ── Copy seed hash ── */
  const copySeedHash = () => {
    navigator.clipboard.writeText(store.seedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const riskOptions: PlinkoRisk[] = ["low", "medium", "high"];
  const rowOptions = [8, 12, 16];

  return (
    <div className="relative min-h-full p-4 sm:p-6">
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
        {/* ────── Plinko Board ────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassPanel
            glow="gold"
            padding={false}
            className="game-panel overflow-hidden p-4 sm:p-6"
          >
            {/* HUD */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-white">NEON PLINKO</span>
              </div>
              <div className="flex gap-3 font-mono text-[11px]">
                <span className="text-white/25">
                  RISK{" "}
                  <span className="font-bold uppercase text-gold">
                    {store.risk}
                  </span>
                </span>
                <span className="text-white/25">
                  ROWS{" "}
                  <span className="font-bold text-white/50">{store.rows}</span>
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

            {/* Canvas */}
            <div className="relative mx-auto mt-4 aspect-[4/5] w-full max-w-md">
              <canvas ref={canvasRef} className="game-canvas h-full w-full" />
            </div>

            {/* Result banner */}
            <AnimatePresence>
              {!store.isDropping && store.multiplier > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center"
                >
                  <p
                    className={`text-lg font-bold ${
                      store.payout >= store.betAmount ? "text-gold" : "text-red-400"
                    }`}
                  >
                    {store.payout >= store.betAmount ? "WIN" : "LOSS"}
                  </p>
                  <p
                    className={`mt-1 font-mono text-2xl font-black ${
                      store.payout >= store.betAmount
                        ? "text-matrix matrix-glow"
                        : "text-red-400/70"
                    }`}
                  >
                    {store.payout >= store.betAmount ? "+" : "−"}
                    {store.payout >= store.betAmount
                      ? store.payout.toFixed(2)
                      : (store.betAmount - store.payout).toFixed(2)}
                  </p>
                  <p className="mt-1 text-[11px] text-white/20">
                    {store.multiplier}x multiplier
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        </motion.div>

        {/* ────── Controls Sidebar ────── */}
        <div className="flex flex-col gap-4">
          {/* Bet Controls */}
          <GlassPanel glow="none" className="game-panel p-5">
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
                  disabled={store.isDropping}
                  className="game-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={store.betAmount}
                  onChange={(e) =>
                    store.setBetAmount(parseFloat(e.target.value) || 0)
                  }
                  disabled={store.isDropping}
                  className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-white/70 outline-none transition-colors focus:border-gold/20 disabled:opacity-50"
                  step="0.01"
                  min="0.01"
                />
                <button
                  onClick={() => store.setBetAmount(store.betAmount * 2)}
                  disabled={store.isDropping}
                  className="game-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Risk Selector */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Risk Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {riskOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => store.setRisk(r)}
                    disabled={store.isDropping}
                    className={`game-button rounded-lg border py-2 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 ${
                      store.risk === r
                        ? r === "high"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : r === "medium"
                            ? "border-gold/30 bg-gold/10 text-gold"
                            : "border-matrix/30 bg-matrix/10 text-matrix"
                        : "border-white/[0.06] bg-white/[0.03] text-white/30 hover:text-white/50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows Selector */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Rows
              </label>
              <div className="grid grid-cols-3 gap-2">
                {rowOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => store.setRows(r)}
                    disabled={store.isDropping}
                    className={`game-button rounded-lg border py-2 text-[11px] font-bold tracking-wider transition-all disabled:opacity-30 ${
                      store.rows === r
                        ? "border-gold/30 bg-gold/10 text-gold"
                        : "border-white/[0.06] bg-white/[0.03] text-white/30 hover:text-white/50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDrop}
              disabled={loading || store.isDropping}
              className="game-button flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-xs font-bold uppercase tracking-widest text-obsidian cta-glow transition-all disabled:opacity-50"
            >
              {loading || store.isDropping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CircleDot className="h-3.5 w-3.5" />
                  DROP BALL
                </>
              )}
            </motion.button>
          </GlassPanel>

          {/* History Panel */}
          <GlassPanel glow="none" className="game-panel p-5">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-gold/50" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">
                Recent Drops
              </h3>
            </div>

            {store.history.length === 0 ? (
              <p className="text-[10px] text-white/15">No drops yet</p>
            ) : (
              <div className="space-y-1.5">
                {store.history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5"
                  >
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        h.payout > 0 && h.multiplier >= 1
                          ? "text-matrix"
                          : "text-red-400/60"
                      }`}
                    >
                      {h.multiplier}x
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        h.payout > 0 && h.multiplier >= 1
                          ? "text-white/40"
                          : "text-white/20"
                      }`}
                    >
                      {h.multiplier >= 1 ? "+" : "−"}
                      {h.payout.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Provably Fair Panel */}
          <GlassPanel glow="none" className="game-panel p-5">
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

            <p className="mt-3 text-[9px] leading-relaxed text-white/10">
              Each ball path is derived from HMAC-SHA256(serverSeed,
              clientSeed:nonce). The hash is committed before the drop.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
