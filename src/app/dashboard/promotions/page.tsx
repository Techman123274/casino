"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Clock,
  Ticket,
  Loader2,
  ArrowRight,
  Zap,
  Trophy,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { GlassPanel } from "@/components/GlassPanel";
import { useBalanceStore } from "@/stores/balance-store";
import { claimDailyCredits, getFaucetStatus } from "@/actions/faucet";
import { redeemPromoCode } from "@/actions/promos";
import { RC_ICON } from "@/lib/currency";

/* ──────────────── Daily Claim Card ──────────────── */

function DailyClaimCard() {
  const { setCredits } = useBalanceStore();
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const status = await getFaucetStatus();
      setCanClaim(status.canClaim);
      setNextClaimAt(status.nextClaimAt);
      setCredits(status.credits);
    } catch {
      /* silent */
    }
  }, [setCredits]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!nextClaimAt) {
      setCountdown("");
      return;
    }
    const update = () => {
      const diff = new Date(nextClaimAt).getTime() - Date.now();
      if (diff <= 0) {
        setCanClaim(true);
        setNextClaimAt(null);
        setCountdown("");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [nextClaimAt]);

  const handleClaim = async () => {
    setLoading(true);
    const res = await claimDailyCredits();
    setLoading(false);

    if (res.ok && res.credits) {
      setCredits(res.credits);
      setCanClaim(false);
      setClaimed(true);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2500);
      checkStatus();
    }
  };

  return (
    <GlassPanel
      glow={canClaim ? "gold" : "none"}
      padding={false}
      className={`
        relative overflow-hidden transition-all duration-500
        ${canClaim ? "border-gold/20" : ""}
      `}
    >
      {/* Background accent */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-3xl" />

      <div className="relative p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.08]">
              <Gift className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Daily Faucet</h3>
              <p className="text-[11px] text-white/25">Claim free RC every 24 hours</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
              100
            </span>
            <span className="ml-1 text-xs font-bold text-gold/50">RC</span>
          </div>
        </div>

        {/* Floating reward */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -40, scale: 1.2 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 text-xl font-black text-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]"
            >
              +100 RC {RC_ICON}
            </motion.div>
          )}
        </AnimatePresence>

        {canClaim ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClaim}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3.5 text-xs font-bold uppercase tracking-widest text-obsidian cta-glow transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                CLAIM 100 RC NOW
              </>
            )}
          </motion.button>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center gap-2">
              {claimed ? (
                <Check className="h-4 w-4 text-matrix" />
              ) : (
                <Clock className="h-4 w-4 text-white/25" />
              )}
              <span className="text-xs font-medium text-white/30">
                {claimed ? "Claimed today" : "Next claim in"}
              </span>
            </div>
            {countdown && (
              <span className="font-mono text-sm font-bold tabular-nums text-gold/60">
                {countdown}
              </span>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

/* ──────────────── Promo Code Redeemer ──────────────── */

function PromoCodeCard() {
  const { setCredits } = useBalanceStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await redeemPromoCode(code);
    setLoading(false);

    if (res.ok && res.credits) {
      setCredits(res.credits);
      setResult({
        type: "success",
        message: `+${res.reward} RC added to your balance!`,
      });
      setCode("");
    } else {
      setResult({ type: "error", message: res.error || "Redemption failed" });
    }

    setTimeout(() => setResult(null), 4000);
  };

  return (
    <GlassPanel glow="none" padding={false} className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl" />

      <div className="relative p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/[0.08]">
            <Ticket className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Promo Code</h3>
            <p className="text-[11px] text-white/25">
              Redeem codes for bonus Rapid Credits
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
            placeholder="ENTER CODE"
            className="h-11 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 font-mono text-sm uppercase tracking-widest text-white/70 placeholder-white/15 outline-none transition-colors focus:border-gold/20 focus:bg-white/[0.05]"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-gold/20 bg-gold/[0.08] px-5 text-xs font-bold text-gold transition-all hover:bg-gold/[0.12] disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                REDEEM
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                result.type === "success"
                  ? "bg-matrix/10 text-matrix"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {result.type === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {result.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassPanel>
  );
}

/* ──────────────── Static Promo Banners ──────────────── */

const PROMO_BANNERS = [
  {
    title: "VIP Ascension",
    desc: "Climb the ranks. Every wager earns XP toward the next VIP tier with exclusive multiplier boosts.",
    icon: Trophy,
    gradient: "from-gold/15 to-amber-900/10",
    accent: "text-gold",
    border: "border-gold/15",
    tag: "PERMANENT",
  },
  {
    title: "First Deposit Bonus",
    desc: "100% match on your first deposit up to 10,000 RC. Double your starting power.",
    icon: Zap,
    gradient: "from-matrix/10 to-emerald-900/10",
    accent: "text-matrix",
    border: "border-matrix/15",
    tag: "NEW USERS",
  },
  {
    title: "Weekend Frenzy",
    desc: "Every Saturday & Sunday: 2x XP on all original games. Stack with VIP multipliers.",
    icon: Sparkles,
    gradient: "from-purple-500/15 to-violet-900/10",
    accent: "text-purple-400",
    border: "border-purple-500/15",
    tag: "RECURRING",
  },
];

/* ──────────────── Main Page ──────────────── */

export default function PromotionsPage() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Promotions</h1>
        <p className="mt-1 text-sm text-white/25">
          Claim rewards. Redeem codes. Fuel your grind.
        </p>
      </motion.div>

      {/* Top row: Daily Claim + Promo Code */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <DailyClaimCard />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PromoCodeCard />
        </motion.div>
      </div>

      {/* Divider */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/[0.04]" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/15">
          Active Promotions
        </span>
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>

      {/* Promo Banners Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PROMO_BANNERS.map((promo, i) => (
          <motion.div
            key={promo.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <GlassPanel
              glow="none"
              padding={false}
              className={`group relative cursor-pointer overflow-hidden transition-all hover:border-white/[0.12] ${promo.border}`}
              whileHover={{ y: -4 }}
            >
              <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${promo.gradient} blur-2xl transition-opacity group-hover:opacity-150`} />

              <div className="relative p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] transition-all group-hover:border-gold/15 group-hover:bg-gold/[0.05]">
                    <promo.icon className={`h-4.5 w-4.5 ${promo.accent}`} />
                  </div>
                  <span className={`rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold tracking-wider ${promo.accent}`}>
                    {promo.tag}
                  </span>
                </div>

                <h3 className="mb-1.5 text-sm font-bold text-white/80 group-hover:text-white">
                  {promo.title}
                </h3>
                <p className="text-[11px] leading-relaxed text-white/25 group-hover:text-white/35">
                  {promo.desc}
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
