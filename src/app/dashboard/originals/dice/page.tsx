"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice5,
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import { useDiceStore } from "@/stores/dice-store";
import { useBalanceStore } from "@/stores/balance-store";
import { rollDice } from "./dice-action";

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

function DiceSlider({
  target,
  isOver,
  onChange,
  disabled,
  roll,
}: {
  target: number;
  isOver: boolean;
  onChange: (v: number) => void;
  disabled: boolean;
  roll: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const barY = h / 2;
    const barH = 8;
    const pad = 16;
    const barW = w - pad * 2;
    const tPx = pad + (target / 100) * barW;

    if (isOver) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.roundRect(pad, barY - barH / 2, tPx - pad, barH, 4);
      ctx.fill();

      ctx.fillStyle = "rgba(0,255,65,0.25)";
      ctx.beginPath();
      ctx.roundRect(tPx, barY - barH / 2, barW - (tPx - pad), barH, 4);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(0,255,65,0.25)";
      ctx.beginPath();
      ctx.roundRect(pad, barY - barH / 2, tPx - pad, barH, 4);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.roundRect(tPx, barY - barH / 2, barW - (tPx - pad), barH, 4);
      ctx.fill();
    }

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(tPx, barY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#020202";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(target.toString(), tPx, barY + 0.5);

    for (let i = 0; i <= 100; i += 10) {
      const x = pad + (i / 100) * barW;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, barY + barH / 2 + 4, 1, 4);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(i.toString(), x, barY + barH / 2 + 18);
    }

    if (roll !== null) {
      const rPx = pad + (roll / 100) * barW;
      const won = isOver ? roll > target : roll < target;
      ctx.fillStyle = won ? "#00FF41" : "#ef4444";
      ctx.beginPath();
      ctx.arc(rPx, barY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = won ? "rgba(0,255,65,0.5)" : "rgba(239,68,68,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rPx, barY - 20);
      ctx.lineTo(rPx, barY + 20);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [target, isOver, roll]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="h-20 w-full game-canvas"
        style={{ width: "100%", height: 80 }}
      />
      <input
        type="range"
        min={1}
        max={98}
        value={target}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
      />
    </div>
  );
}

export default function DicePage() {
  const store = useDiceStore();
  const balanceStore = useBalanceStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [animatedRoll, setAnimatedRoll] = useState<number | null>(null);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  const winChance = store.isOver
    ? ((99.99 - store.target) / 100) * 100
    : (store.target / 100) * 100;
  const multiplier =
    winChance > 0 ? Math.floor((0.99 / (winChance / 100)) * 10000) / 10000 : 0;

  const handleRoll = useCallback(async () => {
    setLoading(true);
    store.startRoll();
    setAnimatedRoll(null);

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    const duration = 600;
    const start = Date.now();
    rollIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
        return;
      }
      setAnimatedRoll(Math.random() * 99.99);
    }, 50);

    const res = await rollDice(
      store.betAmount,
      store.target,
      store.isOver,
      store.clientSeed
    );
    setLoading(false);

    if (rollIntervalRef.current) { clearInterval(rollIntervalRef.current); rollIntervalRef.current = null; }

    if (!res.ok) {
      store.reset();
      alert(res.error);
      return;
    }

    setAnimatedRoll(res.roll);
    balanceStore.setBalance(res.balance);
    store.finishRoll(
      res.roll,
      res.won,
      res.multiplier,
      res.payout,
      res.serverSeed,
      res.seedHash
    );
  }, [store, balanceStore]);

  const copySeedHash = () => {
    navigator.clipboard.writeText(store.seedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayRoll =
    animatedRoll !== null
      ? animatedRoll
      : store.lastRoll !== null
        ? store.lastRoll
        : null;

  return (
    <div className="relative min-h-full p-4 sm:p-6">
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
        {/* ── Game Board ── */}
        <motion.div
          variants={
            store.lastWon === false
              ? shakeVariant
              : store.lastWon === true
                ? goldPulseVariant
                : undefined
          }
          animate={
            store.lastWon === false
              ? "shake"
              : store.lastWon === true
                ? "pulse"
                : undefined
          }
          key={store.nonce}
        >
          <GlassPanel
            glow={
              store.lastWon === true
                ? "gold"
                : store.lastWon === false
                  ? "none"
                  : "gold"
            }
            padding={false}
            className={`overflow-hidden p-4 sm:p-6 game-panel transition-colors duration-500 ${
              store.lastWon === true
                ? "border-gold/30"
                : store.lastWon === false
                  ? "border-red-500/20"
                  : ""
            }`}
          >
            {/* HUD */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Dice5 className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-white">SHADOW DICE</span>
              </div>
              <div className="flex gap-3 font-mono text-[11px]">
                <span className="text-white/25">
                  WIN%{" "}
                  <span className="font-bold text-matrix">
                    {winChance.toFixed(2)}%
                  </span>
                </span>
                <span className="text-white/25">
                  MULT{" "}
                  <span className="font-bold text-gold">{multiplier.toFixed(4)}x</span>
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-white/[0.04]" />

            {/* Big Roll Display */}
            <div className="flex flex-col items-center py-10">
              <motion.div
                key={displayRoll ?? "empty"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-mono text-7xl font-black sm:text-8xl ${
                  store.lastWon === true
                    ? "text-matrix drop-shadow-[0_0_30px_rgba(0,255,65,0.5)]"
                    : store.lastWon === false
                      ? "text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                      : "text-white/20"
                }`}
              >
                {displayRoll !== null ? displayRoll.toFixed(2) : "—"}
              </motion.div>
              {store.lastWon !== null && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 text-sm font-bold ${
                    store.lastWon ? "text-matrix" : "text-red-400"
                  }`}
                >
                  {store.lastWon
                    ? `+${store.lastPayout.toFixed(2)} RC`
                    : `-${store.betAmount.toFixed(2)} RC`}
                </motion.p>
              )}
            </div>

            {/* Slider */}
            <DiceSlider
              target={store.target}
              isOver={store.isOver}
              onChange={(v) => store.setTarget(v)}
              disabled={store.rolling}
              roll={store.lastRoll}
            />

            {/* Over / Under toggle */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => store.setIsOver(false)}
                disabled={store.rolling}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  !store.isOver
                    ? "bg-matrix/15 text-matrix border border-matrix/20"
                    : "bg-white/[0.03] text-white/25 border border-white/[0.06] hover:text-white/40"
                }`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
                UNDER {store.target}
              </button>
              <button
                onClick={() => store.setIsOver(true)}
                disabled={store.rolling}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  store.isOver
                    ? "bg-matrix/15 text-matrix border border-matrix/20"
                    : "bg-white/[0.03] text-white/25 border border-white/[0.06] hover:text-white/40"
                }`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
                OVER {store.target}
              </button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ── Controls Sidebar ── */}
        <div className="flex flex-col gap-4">
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
                  disabled={store.rolling}
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
                  disabled={store.rolling}
                  className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-white/70 outline-none transition-colors focus:border-gold/20 disabled:opacity-50"
                  step="0.01"
                  min="0.01"
                />
                <button
                  onClick={() => store.setBetAmount(store.betAmount * 2)}
                  disabled={store.rolling}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Target */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] font-medium text-white/25">
                Target ({store.target})
              </label>
              <input
                type="range"
                min={1}
                max={98}
                value={store.target}
                onChange={(e) => store.setTarget(parseInt(e.target.value))}
                disabled={store.rolling}
                className="w-full accent-gold disabled:opacity-30"
              />
              <div className="mt-1 flex justify-between text-[10px] text-white/15">
                <span>1</span>
                <span>98</span>
              </div>
            </div>

            {/* Roll Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRoll}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-xs font-bold uppercase tracking-widest text-obsidian cta-glow game-button transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Dice5 className="h-3.5 w-3.5" />
                  ROLL DICE
                </>
              )}
            </motion.button>
          </GlassPanel>

          {/* History */}
          {store.history.length > 0 && (
            <GlassPanel glow="none" className="p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/30">
                Recent Rolls
              </h3>
              <div className="space-y-1.5">
                {store.history.slice(0, 10).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 font-mono text-[11px]"
                  >
                    <span className="text-white/30">
                      {h.isOver ? "Over" : "Under"} {h.target}
                    </span>
                    <span
                      className={`font-bold ${h.won ? "text-matrix" : "text-red-400"}`}
                    >
                      {h.roll.toFixed(2)}
                    </span>
                    <span
                      className={`${h.won ? "text-matrix" : "text-red-400/50"}`}
                    >
                      {h.won ? `+${h.payout.toFixed(2)}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Fairness Panel */}
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
                disabled={store.rolling}
                className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/40 outline-none transition-colors focus:border-gold/20 disabled:opacity-40"
              />
            </div>

            <p className="mt-3 text-[9px] leading-relaxed text-white/10">
              Each roll is derived from HMAC-SHA256(serverSeed, clientSeed:nonce).
              Verify: SHA-256(serverSeed) === seedHash.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
