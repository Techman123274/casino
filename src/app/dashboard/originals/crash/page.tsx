"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Crosshair,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/GlassPanel";
import { useCrashStore, type CrashPhase, type LedgerPlayer } from "@/stores/crash-store";
import { useBalanceStore } from "@/stores/balance-store";
import { useCrashSocket } from "@/hooks/useCrashSocket";
import { damp } from "@/lib/perf";
import { triggerHaptic } from "@/lib/haptics";
import {
  placeCrashBet,
  crashCashOut,
  finishCrashRound,
  forceNewRound,
  transitionToFlying,
} from "./crash-action";

/* ═══════════════════════════════════════════════
   FRAGMENT + PARTICLE TYPES
   ═══════════════════════════════════════════════ */

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; color: string;
}

interface Fragment {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  size: number; life: number; maxLife: number;
  color: string;
}

/* ═══════════════════════════════════════════════
   BEZIER TRAJECTORY
   ═══════════════════════════════════════════════ */

function getTrajectoryPoint(t: number, w: number, h: number): [number, number] {
  const p0x = 0.08, p0y = 0.88;
  const p1x = 0.25, p1y = 0.70;
  const p2x = 0.55, p2y = 0.25;
  const p3x = 0.82, p3y = 0.06;
  const u = 1 - t;
  const x = u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x;
  const y = u*u*u*p0y + 3*u*u*t*p1y + 3*u*t*t*p2y + t*t*t*p3y;
  return [x * w, y * h];
}

function getTrajectoryAngle(t: number, w: number, h: number): number {
  const dt = 0.005;
  const [x1, y1] = getTrajectoryPoint(Math.max(0, t - dt), w, h);
  const [x2, y2] = getTrajectoryPoint(Math.min(1, t + dt), w, h);
  return Math.atan2(y2 - y1, x2 - x1);
}

/* ═══════════════════════════════════════════════
   PARALLAX STARFIELD (3 layers) + ROCKET CANVAS
   ═══════════════════════════════════════════════ */

interface Star {
  x: number; y: number; z: number; s: number; layer: number;
}

function StarfieldCanvas({ phase, multiplier, milestone }: { phase: CrashPhase; multiplier: number; milestone: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const fragmentsRef = useRef<Fragment[]>([]);
  const trailRef = useRef<[number, number][]>([]);
  const frameRef = useRef<number>(0);
  const rocketPosRef = useRef<[number, number]>([0, 0]);
  const lastMilestoneRef = useRef(0);
  const shakeRef = useRef({ x: 0, y: 0, decay: 0 });
  const lastFrameTimeRef = useRef(0);
  const crashTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const pr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * pr;
      canvas.height = canvas.offsetHeight * pr;
      ctx.scale(pr, pr);
    };
    resize();
    window.addEventListener("resize", resize);

    if (starsRef.current.length === 0) {
      for (let i = 0; i < 350; i++) {
        const layer = i < 80 ? 0 : i < 200 ? 1 : 2;
        starsRef.current.push({
          x: Math.random() * 2000 - 1000,
          y: Math.random() * 2000 - 1000,
          z: Math.random() * 1000,
          s: layer === 0 ? 0.3 + Math.random() * 0.5 : layer === 1 ? 0.6 + Math.random() * 1.0 : 1.2 + Math.random() * 1.5,
          layer,
        });
      }
    }

    let running = true;
    lastFrameTimeRef.current = performance.now();

    const spawnParticles = (cx: number, cy: number, count: number, gold: boolean) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 0, maxLife: 40 + Math.random() * 40,
          size: 1.5 + Math.random() * 3,
          color: gold
            ? `hsl(${45 + Math.random() * 15}, 100%, ${55 + Math.random() * 30}%)`
            : `hsl(${120 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`,
        });
      }
    };

    const spawnFragments = (cx: number, cy: number) => {
      const colors = ["#FFD700", "#FF6B00", "#FF2200", "#00FF41", "#FFB800", "#FF4500"];
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 3 + Math.random() * 9;
        fragmentsRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.4,
          size: 3 + Math.random() * 7,
          life: 0, maxLife: 60 + Math.random() * 80,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      spawnParticles(cx, cy, 60, true);
      shakeRef.current.decay = 25;
    };

    const draw = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastFrameTimeRef.current, 50);
      lastFrameTimeRef.current = now;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const isFlying = phase === "running";
      const isCrashed = phase === "crashed";
      const baseSpeed = isFlying ? Math.min(4 + multiplier * 0.5, 30) : 0.3;

      // ── Shake ──
      if (shakeRef.current.decay > 0) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.decay * 2;
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.decay * 2;
        shakeRef.current.decay *= 0.90;
        if (shakeRef.current.decay < 0.3) shakeRef.current.decay = 0;
      } else {
        shakeRef.current.x = 0;
        shakeRef.current.y = 0;
      }

      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // ── 3-layer parallax starfield ──
      const layerSpeeds = [0.3, 1.0, 2.2];
      for (const star of starsRef.current) {
        const speed = baseSpeed * layerSpeeds[star.layer];
        star.z -= speed;
        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * 2000 - 1000;
          star.y = Math.random() * 2000 - 1000;
        }

        const sx = (star.x / star.z) * (w / 2) + w / 2;
        const sy = (star.y / star.z) * (h / 2) + h / 2;
        const r = ((1 - star.z / 1000) * star.s * 2) + 0.3;

        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

        const alpha = Math.min(1, (1 - star.z / 1000) * 1.5);
        const starAlpha = star.layer === 0 ? alpha * 0.35 : star.layer === 1 ? alpha * 0.55 : alpha * 0.8;

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
        ctx.fill();

        // Motion streaks at high speed (only foreground layer)
        if (isFlying && speed > 8 && star.layer === 2) {
          const tLen = Math.min(speed * 3, 50);
          const tsx = ((star.x / (star.z + tLen)) * (w / 2)) + w / 2;
          const tsy = ((star.y / (star.z + tLen)) * (h / 2)) + h / 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tsx, tsy);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
          ctx.lineWidth = r * 0.5;
          ctx.stroke();
        }
      }

      // ── Faint bezier trajectory guide ──
      if (isFlying) {
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const t = i / 80;
          const [px, py] = getTrajectoryPoint(t, w, h);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "rgba(255, 215, 0, 0.05)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Rocket position on bezier curve ──
      const progress = isFlying
        ? Math.min(0.97, Math.log2(Math.max(1, multiplier)) * 0.12)
        : isCrashed ? 0.5 : 0.0;

      const [targetX, targetY] = isFlying || isCrashed
        ? getTrajectoryPoint(progress, w, h)
        : [w * 0.1, h * 0.85];

      rocketPosRef.current[0] = damp(rocketPosRef.current[0] || targetX, targetX, 70, dt);
      rocketPosRef.current[1] = damp(rocketPosRef.current[1] || targetY, targetY, 70, dt);

      const rx = rocketPosRef.current[0];
      const ry = rocketPosRef.current[1];

      // ── Plasma trail (Electric Gold) ──
      if (isFlying) {
        trailRef.current.push([rx, ry]);
        const maxLen = Math.min(100, 12 + multiplier * 4);
        if (trailRef.current.length > maxLen) trailRef.current = trailRef.current.slice(-maxLen);

        if (trailRef.current.length > 2) {
          for (let i = 1; i < trailRef.current.length; i++) {
            const t = i / trailRef.current.length;
            const [px, py] = trailRef.current[i];
            const [ppx, ppy] = trailRef.current[i - 1];
            const trailWidth = t * (3.5 + multiplier * 0.35);

            ctx.beginPath();
            ctx.moveTo(ppx, ppy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `hsla(${38 + t * 12}, 100%, 55%, ${t * 0.55})`;
            ctx.lineWidth = trailWidth;
            ctx.lineCap = "round";
            ctx.stroke();
          }

          const last = trailRef.current[trailRef.current.length - 1];
          const glowR = 35 + multiplier * 1.5;
          const trailGrad = ctx.createRadialGradient(last[0], last[1], 0, last[0], last[1], glowR);
          trailGrad.addColorStop(0, `rgba(255, 215, 0, ${Math.min(0.18, multiplier * 0.006)})`);
          trailGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
          ctx.fillStyle = trailGrad;
          ctx.fillRect(0, 0, w, h);
        }
      } else {
        trailRef.current = [];
      }

      // ── Milestone particles ──
      if (milestone > lastMilestoneRef.current && isFlying) {
        lastMilestoneRef.current = milestone;
        spawnParticles(rx, ry, milestone >= 50 ? 70 : milestone >= 10 ? 45 : 25, true);
        shakeRef.current.decay = milestone >= 50 ? 18 : milestone >= 10 ? 12 : 6;
      }
      if (phase !== "running") lastMilestoneRef.current = 0;

      const wobble = isFlying ? Math.sin(Date.now() * 0.006) * 2.5 : 0;

      ctx.save();
      ctx.translate(rx + wobble, ry);

      if (isCrashed) {
        // ── Fragment explosion ──
        if (crashTimeRef.current === 0) {
          crashTimeRef.current = now;
          spawnFragments(rx, ry);
        }

        const age = Math.min(1, (now - crashTimeRef.current) / 1500);

        for (let ring = 0; ring < 3; ring++) {
          const ringAge = Math.max(0, age - ring * 0.12);
          if (ringAge <= 0) continue;
          ctx.beginPath();
          ctx.arc(0, 0, ringAge * 90 + ring * 12, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, ${69 + ring * 50}, 0, ${(1 - ringAge) * 0.35})`;
          ctx.lineWidth = 2.5 - ring * 0.6;
          ctx.stroke();
        }

        if (age < 0.3) {
          const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
          flashGrad.addColorStop(0, `rgba(255, 200, 0, ${(1 - age / 0.3) * 0.7})`);
          flashGrad.addColorStop(1, "rgba(255, 200, 0, 0)");
          ctx.fillStyle = flashGrad;
          ctx.fillRect(-60, -60, 120, 120);
        }
      } else {
        crashTimeRef.current = 0;

        // ── Rocket body — tilt follows trajectory tangent ──
        const trajectoryAngle = isFlying
          ? getTrajectoryAngle(progress, w, h) - Math.PI / 2
          : -0.2;
        ctx.rotate(trajectoryAngle);

        const sc = isFlying ? 1 + Math.sin(Date.now() * 0.012) * 0.04 : 1;
        ctx.scale(sc, sc);

        // Fuselage
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.bezierCurveTo(-6, -10, -9, 8, -7, 16);
        ctx.lineTo(-4, 14); ctx.lineTo(0, 18); ctx.lineTo(4, 14); ctx.lineTo(7, 16);
        ctx.bezierCurveTo(9, 8, 6, -10, 0, -22);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, -22, 0, 18);
        grad.addColorStop(0, "#FFD700");
        grad.addColorStop(0.3, "#FFC200");
        grad.addColorStop(0.6, "#FF8C00");
        grad.addColorStop(1, "#FF5500");
        ctx.fillStyle = grad;
        ctx.fill();

        // Glass cockpit
        ctx.beginPath();
        ctx.ellipse(0, -12, 3, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 65, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 255, 65, 0.6)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Engine glow
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = isFlying ? 30 + multiplier * 2.5 : 10;
        ctx.beginPath();
        ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Flame exhaust
        if (isFlying) {
          const fLen = 14 + multiplier * 2.5 + Math.sin(Date.now() * 0.025) * 7;
          const fGrad = ctx.createLinearGradient(0, 18, 0, 18 + fLen);
          fGrad.addColorStop(0, "rgba(255, 100, 0, 0.95)");
          fGrad.addColorStop(0.3, "rgba(255, 180, 0, 0.7)");
          fGrad.addColorStop(0.7, "rgba(255, 215, 0, 0.3)");
          fGrad.addColorStop(1, "rgba(255, 215, 0, 0)");

          ctx.beginPath();
          ctx.moveTo(-5, 18);
          ctx.quadraticCurveTo(-3 + Math.sin(Date.now() * 0.03) * 2.5, 18 + fLen * 0.5, 0, 18 + fLen);
          ctx.quadraticCurveTo(3 + Math.sin(Date.now() * 0.04) * 2.5, 18 + fLen * 0.5, 5, 18);
          ctx.fillStyle = fGrad;
          ctx.fill();

          if (multiplier >= 5) {
            const sLen = fLen * 0.45;
            ctx.globalAlpha = Math.min(1, (multiplier - 5) / 10);
            for (const side of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(side * 7, 14);
              ctx.quadraticCurveTo(side * 10, 14 + sLen * 0.6, side * 8, 14 + sLen);
              ctx.quadraticCurveTo(side * 6, 14 + sLen * 0.4, side * 4, 14);
              ctx.fillStyle = "rgba(0, 180, 255, 0.5)";
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }

          if (Math.random() < 0.5) spawnParticles(rx + wobble, ry + 22, 1, false);
        }
      }

      ctx.restore();

      // ── Draw fragments ──
      fragmentsRef.current = fragmentsRef.current.filter((f) => {
        f.x += f.vx; f.y += f.vy; f.vy += 0.08; f.vx *= 0.99;
        f.rotation += f.rotSpeed; f.life++;
        const alpha = Math.max(0, 1 - f.life / f.maxLife);
        if (alpha <= 0) return false;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = alpha;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 10 * alpha;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(0, -f.size);
        ctx.lineTo(f.size * 0.6, 0);
        ctx.lineTo(0, f.size * 0.4);
        ctx.lineTo(-f.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
        return true;
      });

      // ── Draw particles ──
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.98; p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (alpha <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${alpha})`).replace("hsl", "hsla");
        ctx.fill();
        return true;
      });

      ctx.restore();
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      particlesRef.current = [];
      fragmentsRef.current = [];
      trailRef.current = [];
      window.removeEventListener("resize", resize);
    };
  }, [phase, multiplier, milestone]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full game-canvas"
      style={{ background: "radial-gradient(ellipse at 30% 80%, #0a0a2a 0%, #020202 60%)" }}
    />
  );
}

/* ═══════════════════════════════════════════════
   MULTIPLIER HUD
   ═══════════════════════════════════════════════ */

function MultiplierHUD({ multiplier, phase, crashPoint }: { multiplier: number; phase: CrashPhase; crashPoint: number }) {
  const intensity = Math.min(1, (multiplier - 1) / 50);
  const color =
    phase === "crashed" ? "text-red-500"
    : multiplier >= 50 ? "text-gold drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]"
    : multiplier >= 10 ? "text-amber-400 drop-shadow-[0_0_20px_rgba(255,180,0,0.4)]"
    : multiplier >= 2 ? "text-amber-300"
    : "text-white";

  return (
    <div className="relative z-10 flex flex-col items-center justify-center">
      <motion.div
        className={`font-mono font-black tracking-tighter multiplier-odometer ${color}`}
        style={{
          fontSize: "clamp(3rem, 12vw, 7rem)",
          textShadow: phase === "crashed"
            ? "0 0 40px rgba(255, 0, 0, 0.6), 0 0 80px rgba(255, 0, 0, 0.3)"
            : `0 0 ${Math.min(50, 5 + multiplier * 3)}px rgba(255, 215, 0, ${0.2 + intensity * 0.6})`,
        }}
        animate={phase === "crashed" ? { scale: [1, 1.15, 0.92, 1.05, 1], x: [0, -15, 15, -8, 8, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {phase === "crashed" ? `${crashPoint.toFixed(2)}x`
          : phase === "betting" ? "—"
          : `${multiplier.toFixed(2)}x`}
      </motion.div>
      <motion.p
        className={`mt-1 text-xs font-bold uppercase tracking-[0.3em] ${
          phase === "crashed" ? "text-red-400"
          : phase === "betting" ? "text-gold/60"
          : phase === "running" ? "text-matrix"
          : "text-white/20"
        }`}
        animate={phase === "running" ? { opacity: [0.4, 1, 0.4] } : {}}
        transition={phase === "running" ? { repeat: Infinity, duration: 1.5 } : {}}
      >
        {phase === "crashed" ? "CRASHED" : phase === "betting" ? "PLACE YOUR BETS" : phase === "running" ? "TO THE MOON" : "WAITING…"}
      </motion.p>
    </div>
  );
}

function HistoryPill({ point }: { point: number }) {
  const c = point >= 10 ? "border-gold/30 text-gold bg-gold/[0.06]"
    : point >= 2 ? "border-matrix/20 text-matrix bg-matrix/[0.04]"
    : "border-red-500/20 text-red-400 bg-red-500/[0.04]";
  return <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${c}`}>{point.toFixed(2)}x</span>;
}

/* ═══════════════════════════════════════════════
   PLAYER LEDGER
   ═══════════════════════════════════════════════ */

function PlayerLedger({ players, phase }: { players: LedgerPlayer[]; phase: CrashPhase }) {
  return (
    <GlassPanel glow="none" className="p-4 game-panel">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gold/50" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Round Players</h3>
        </div>
        <span className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/20">{players.length}</span>
      </div>
      <div className="max-h-[300px] space-y-1 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="popLayout">
          {players.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-white/10">
              {phase === "betting" ? "Waiting for bets…" : "No players this round"}
            </p>
          ) : players.map((p) => (
            <motion.div key={p.userId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} layout
              className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-500 ${
                p.cashedOut ? "border-matrix/20 bg-matrix/[0.04]" : "border-white/[0.04] bg-white/[0.02]"
              }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{p.avatar}</span>
                <span className="truncate font-mono text-[11px] text-white/50">{p.username}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.cashedOut ? (<>
                  <span className="font-mono text-[10px] font-bold text-matrix">{p.cashoutMult.toFixed(2)}x</span>
                  <span className="font-mono text-[10px] font-bold text-gold">+{p.payout.toFixed(0)}</span>
                </>) : (
                  <span className="font-mono text-[10px] text-white/25">{p.amount.toFixed(0)} RC</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassPanel>
  );
}

/* ═══════════════════════════════════════════════
   MOCK PLAYERS
   ═══════════════════════════════════════════════ */

const MOCK_NAMES = ["CryptoWhale_42","LunarBull","DiamondHands","NeonTrader","SatoshiFan","ElonDegen","RocketRider","MoonHunter","VoidWalker","MatrixGod","CyberApe","GoldDigger99","DegenKing","Phantom_X","StealthBet"];
const MOCK_AVATARS = ["🐺","🦊","💀","🤖","🔮","⚡","🎲","🃏","👾","🛸"];
function randomMock() {
  return { name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)], avatar: MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)] };
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function CrashPage() {
  const store = useCrashStore();
  const balanceStore = useBalanceStore();
  const socket = useCrashSocket();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const mockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initRef = useRef(false);
  const BET_TIME = 5;

  /* ── Cleanup helper ── */
  const clearTimers = useCallback(() => {
    if (mockRef.current) { clearInterval(mockRef.current); mockRef.current = null; }
    if (watchRef.current) { clearInterval(watchRef.current); watchRef.current = null; }
  }, []);

  /* ── Start new round (server-gated) ── */
  const startNewRound = useCallback(async () => {
    clearTimers();
    socket.stop();
    store.resetRound();

    const { snapshot, history } = await forceNewRound();

    store.setSeedHash(snapshot.seedHash);
    store.setRoundId(snapshot.id);
    store.setCrashPoint(snapshot.crashPoint);
    store.setHistory(history);
    store.setRoundReady(true);

    const mocks: LedgerPlayer[] = [];
    const mockCount = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < mockCount; i++) {
      const m = randomMock();
      mocks.push({ userId: `mock-${i}`, username: m.name, avatar: m.avatar, amount: Math.round((20 + Math.random() * 480) * 100) / 100, cashedOut: false, cashoutMult: 0, payout: 0 });
    }
    store.setPlayers(mocks);
    store.setPhase("betting");

    let cd = BET_TIME;
    store.setCountdown(cd);

    const countdownId = setInterval(() => {
      cd--;
      store.setCountdown(cd);
      if (cd <= 0) {
        clearInterval(countdownId);
        runFlying(snapshot.crashPoint);
      }
    }, 1000);
  }, []);

  /* ── FLYING — server-authoritative timing ── */
  const runFlying = useCallback(async (crashPoint: number) => {
    const flySnapshot = await transitionToFlying();
    const serverStartTime = flySnapshot.flyStartedAt ?? Date.now();

    store.setPhase("running");
    store.setMultiplier(1.0);
    store.setFlyStartedAt(serverStartTime);

    const autoCashout = useCrashStore.getState().autoCashout;

    socket.start(crashPoint, serverStartTime);

    mockRef.current = setInterval(() => {
      const curr = useCrashStore.getState().multiplier;
      if (curr <= 1.2) return;
      const state = useCrashStore.getState();
      const uncashed = state.players.filter((p) => p.userId.startsWith("mock-") && !p.cashedOut);
      if (uncashed.length === 0) return;
      if (Math.random() < 0.2) {
        const pick = uncashed[Math.floor(Math.random() * uncashed.length)];
        const mult = Math.round((curr * (0.6 + Math.random() * 0.4)) * 100) / 100;
        const payout = Math.round(pick.amount * mult * 100) / 100;
        store.updatePlayer(pick.userId, { cashedOut: true, cashoutMult: mult, payout });
      }
    }, 900);

    watchRef.current = setInterval(async () => {
      const state = useCrashStore.getState();

      if (autoCashout > 0 && state.multiplier >= autoCashout && state.hasBet && !state.hasCashedOut) {
        handleCashOut();
      }

      if (state.multiplier >= crashPoint) {
        clearTimers();
        socket.stop();
        store.setMultiplier(crashPoint);
        store.setPhase("crashed");

        const result = await finishCrashRound();
        store.setServerSeed(result.serverSeed);
        store.addHistory(crashPoint);

        setTimeout(() => startNewRound(), 3500);
      }
    }, 50);
  }, []);

  /* ── Cash out (server-verified) ── */
  const handleCashOut = useCallback(async () => {
    const state = useCrashStore.getState();
    if (!state.hasBet || state.hasCashedOut || state.phase !== "running") return;
    setLoading(true);
    const res = await crashCashOut(state.multiplier);
    setLoading(false);

    if (res.ok) {
      triggerHaptic("heavy");
      balanceStore.setBalance(res.balance);
      store.cashOut(res.multiplier, res.payout);
      const self = res.snapshot.players.find((p) => !p.userId.startsWith("mock-"));
      if (self) store.updatePlayer(self.userId, { cashedOut: true, cashoutMult: res.multiplier, payout: res.payout });
    }
  }, [balanceStore, store]);

  /* ── Place bet ── */
  const handlePlaceBet = useCallback(async () => {
    if (store.phase !== "betting" || store.hasBet || !store.roundReady) return;
    setLoading(true);
    const res = await placeCrashBet(store.betAmount);
    setLoading(false);

    if (!res.ok) { alert(res.error); return; }

    triggerHaptic("light");
    balanceStore.setBalance(res.balance);
    store.placeBet();

    const selfPlayer = res.snapshot.players.find((p) => !p.userId.startsWith("mock-"));
    if (selfPlayer) store.setPlayers([...useCrashStore.getState().players, { ...selfPlayer }]);
  }, [store, balanceStore]);

  /* ── Init ── */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    startNewRound();
    return () => { socket.stop(); clearTimers(); };
  }, [startNewRound]);

  const copySeedHash = () => {
    navigator.clipboard.writeText(store.seedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const canBet = store.phase === "betting" && !store.hasBet && store.roundReady;
  const canCashOut = store.phase === "running" && store.hasBet && !store.hasCashedOut;

  return (
    <div className="relative min-h-full p-4 sm:p-6">
      {/* Crash flash overlay */}
      <AnimatePresence>
        {store.phase === "crashed" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 bg-red-900/10 mix-blend-overlay">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,0,0.03)_2px,rgba(255,0,0,0.03)_4px)] animate-[scan-line_0.5s_linear]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back nav */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
        <Link href="/dashboard/originals" className="inline-flex items-center gap-2 text-xs text-white/25 transition-colors hover:text-white/50">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Originals
        </Link>
      </motion.div>

      {/* History strip */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/15">History</span>
        <AnimatePresence mode="popLayout">
          {store.history.map((point, i) => (
            <motion.div key={`h-${point}-${i}`} initial={{ opacity: 0, scale: 0.8, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }}>
              <HistoryPill point={point} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* ────── Visualizer ────── */}
        <div className="flex flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <GlassPanel glow={store.phase === "crashed" ? "none" : "gold"} padding={false}
              className={`relative aspect-[16/9] overflow-hidden canvas-container transition-colors duration-500 ${store.phase === "crashed" ? "border-red-500/20" : ""}`}>
              <StarfieldCanvas phase={store.phase} multiplier={store.multiplier} milestone={store.milestone} />

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                <MultiplierHUD multiplier={store.multiplier} phase={store.phase} crashPoint={store.crashPoint} />

                {store.phase === "betting" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
                        initial={{ width: "100%" }} animate={{ width: "0%" }}
                        transition={{ duration: store.countdown, ease: "linear" }} />
                    </div>
                    <span className="font-mono text-xs font-bold text-gold">{store.countdown}s</span>
                  </motion.div>
                )}

                <AnimatePresence>
                  {store.hasCashedOut && store.phase === "running" && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="mt-4 rounded-xl border border-matrix/20 bg-matrix/10 px-5 py-3 text-center backdrop-blur-sm">
                      <p className="text-[10px] uppercase text-matrix/60">Cashed Out</p>
                      <p className="font-mono text-xl font-black text-matrix">+{store.payout.toFixed(2)} RC</p>
                      <p className="text-[10px] text-matrix/40">@ {store.cashoutMultiplier.toFixed(2)}x</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Provably Fair Ledger Bar ── */}
              <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-white/[0.04] bg-obsidian/80 px-4 py-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Rocket className="h-3.5 w-3.5 text-gold/40" />
                  <span className="font-mono text-[10px] text-white/25">ROUND #{store.roundId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-gold/30" />
                  <code className="font-mono text-[9px] tracking-wider text-gold/40">
                    {store.seedHash || "—"}
                  </code>
                  {store.seedHash && (
                    <button onClick={copySeedHash} className="ml-1 text-white/15 transition-colors hover:text-white/40">
                      {copied ? <Check className="h-2.5 w-2.5 text-matrix" /> : <Copy className="h-2.5 w-2.5" />}
                    </button>
                  )}
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* ────── Controls ────── */}
          <GlassPanel glow="none" className="p-5 game-panel">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30">
              <Crosshair className="h-3.5 w-3.5 text-gold/50" />Control Panel
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-white/25">Bet Amount (RC)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => store.setBetAmount(Math.max(1, store.betAmount / 2))} disabled={!canBet} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                  <input type="number" value={store.betAmount} onChange={(e) => store.setBetAmount(parseFloat(e.target.value) || 1)} disabled={!canBet} className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-white/70 outline-none transition-colors focus:border-gold/20 disabled:opacity-50" step="1" min="1" />
                  <button onClick={() => store.setBetAmount(store.betAmount * 2)} disabled={!canBet} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                {canBet && (
                  <div className="mt-2 flex gap-1.5">
                    {[50, 100, 250, 500].map((amt) => (
                      <button key={amt} onClick={() => store.setBetAmount(amt)} className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] py-1 font-mono text-[10px] text-white/20 transition-colors hover:border-gold/10 hover:text-white/40">{amt}</button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-white/25">Auto Cash Out (0 = off)</label>
                <input type="number" value={store.autoCashout || ""} onChange={(e) => store.setAutoCashout(parseFloat(e.target.value) || 0)} disabled={!canBet} placeholder="e.g. 2.00" className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-center font-mono text-sm text-white/70 outline-none transition-colors focus:border-gold/20 disabled:opacity-50" step="0.1" min="1.01" />
              </div>
            </div>

            <div className="mt-5">
              {canCashOut ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCashOut} disabled={loading}
                  className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-matrix/30 bg-matrix/10 py-4 text-sm font-bold uppercase tracking-widest text-matrix transition-all hover:bg-matrix/20 disabled:opacity-30">
                  <motion.span className="absolute inset-0 rounded-xl border-2 border-matrix" animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.015, 1] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }} />
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="h-5 w-5" />CASH OUT ({(store.betAmount * store.multiplier).toFixed(2)} RC)</>}
                </motion.button>
              ) : store.hasBet && store.phase === "running" ? (
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] py-3 text-center text-[11px] text-white/20">
                  {store.hasCashedOut ? <span className="text-matrix">Cashed out at {store.cashoutMultiplier.toFixed(2)}x</span> : "Waiting for crash…"}
                </div>
              ) : store.phase === "betting" ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handlePlaceBet} disabled={loading || store.hasBet || !store.roundReady}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-4 text-sm font-bold uppercase tracking-widest text-obsidian cta-glow transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : store.hasBet ? <><Check className="h-5 w-5" />BET PLACED</> : <><Rocket className="h-4 w-4" />PLACE BET</>}
                </motion.button>
              ) : (
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] py-3 text-center text-[11px] text-white/20">
                  {store.phase === "crashed" ? "Next round starting…" : "Waiting for round…"}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* ────── Right Column: Ledger + Fairness ────── */}
        <div className="flex flex-col gap-4">
          <PlayerLedger players={store.players} phase={store.phase} />

          <GlassPanel glow="none" className="p-4 game-panel">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold/50" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Provably Fair</h3>
            </div>

            <div className="mb-2">
              <label className="mb-1 block text-[10px] text-white/20">Server Seed Hash</label>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 truncate rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-white/30">{store.seedHash || "—"}</code>
                {store.seedHash && (
                  <button onClick={copySeedHash} className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5 text-white/20 transition-colors hover:text-white/50">
                    {copied ? <Check className="h-3 w-3 text-matrix" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </div>

            {store.serverSeed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="mb-1 block text-[10px] text-white/20">Server Seed (revealed)</label>
                <code className="block truncate rounded-lg border border-matrix/10 bg-matrix/[0.03] px-2.5 py-1.5 font-mono text-[10px] text-matrix/50">{store.serverSeed}</code>
              </motion.div>
            )}

            <p className="mt-3 text-[9px] leading-relaxed text-white/10">
              Crash point = HMAC-SHA256(serverSeed, clientSeed:nonce). Hash committed before round. Seed revealed after crash for verification.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
