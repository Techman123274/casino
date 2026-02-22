"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, User, Gift, Loader2, ChevronDown } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { DepositModal } from "./DepositModal";
import { useBalanceStore } from "@/stores/balance-store";
import { formatRCValue, RC_ICON, RC_SYMBOL } from "@/lib/currency";
import { claimDailyCredits, getFaucetStatus } from "@/actions/faucet";

function RollingDigit({ digit, index }: { digit: string; index: number }) {
  return (
    <motion.span
      key={`${digit}-${index}`}
      initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 30,
        delay: index * 0.02,
      }}
      className="inline-block"
    >
      {digit}
    </motion.span>
  );
}

function RCBadge() {
  const { credits, pulseKey } = useBalanceStore();
  const display = formatRCValue(credits);
  const digits = display.split("");

  return (
    <div className="relative flex items-center gap-2">
      <AnimatePresence>
        {pulseKey > 0 && (
          <motion.div
            key={pulseKey}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 rounded-xl border-2 border-gold/50"
          />
        )}
      </AnimatePresence>

      {pulseKey > 0 && (
        <motion.div
          key={`flash-${pulseKey}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-xl bg-gold/10"
        />
      )}

      <span className="text-base text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">
        {RC_ICON}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] leading-none text-white/35">Rapid Credits</span>
        <span
          key={credits}
          className="text-sm font-bold tabular-nums text-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.3)]"
        >
          <AnimatePresence mode="popLayout">
            {digits.map((d, i) => (
              <RollingDigit key={`${i}-${d}`} digit={d} index={i} />
            ))}
          </AnimatePresence>{" "}
          <span className="text-[10px] font-semibold text-gold/50">{RC_SYMBOL}</span>
        </span>
      </div>
    </div>
  );
}

function FaucetButton() {
  const { setCredits } = useBalanceStore();
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const status = await getFaucetStatus();
      setCanClaim(status.canClaim);
      setNextClaimAt(status.nextClaimAt);
      setCredits(status.credits);
    } catch {
      /* ignore on initial load */
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
      setCountdown(`${h}h ${m}m`);
    };
    update();
    const iv = setInterval(update, 30_000);
    return () => clearInterval(iv);
  }, [nextClaimAt]);

  const handleClaim = async () => {
    setLoading(true);
    const res = await claimDailyCredits();
    setLoading(false);

    if (res.ok && res.credits) {
      setCredits(res.credits);
      setCanClaim(false);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2000);
      checkStatus();
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={canClaim ? handleClaim : undefined}
        disabled={!canClaim || loading}
        className={`
          relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold
          transition-all
          ${canClaim
            ? "border border-gold/25 bg-gold/[0.08] text-gold hover:bg-gold/[0.12] cta-glow"
            : "border border-white/[0.06] bg-white/[0.03] text-white/25 cursor-default"
          }
        `}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Gift className="h-3.5 w-3.5" />
        )}
        {canClaim ? "CLAIM" : countdown || "CLAIMED"}
      </motion.button>

      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]"
          >
            +100 RC
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNav() {
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <>{depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex h-16 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 backdrop-blur-md"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <motion.div
          className="relative flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <span className="text-lg font-bold">R</span>
          </div>
          <span className="text-gradient-gold text-lg font-bold tracking-wider">
            RAPID ROLE
          </span>
          <span className="ml-1 rounded-full bg-matrix/10 px-2 py-0.5 text-[10px] font-semibold text-matrix">
            BETA
          </span>
        </motion.div>
      </div>

      {/* Center: Search */}
      <div className="mx-8 hidden max-w-md flex-1 md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search games, providers..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-white/70 placeholder:text-white/20 outline-none transition-all focus:border-gold/30 focus:bg-white/[0.05]"
          />
        </div>
      </div>

      {/* Right: Faucet + Wallet + Actions */}
      <div className="flex items-center gap-3">
        {/* Daily Faucet */}
        <FaucetButton />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative rounded-xl p-2 text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/70"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-matrix" />
        </motion.button>

        {/* RC Wallet */}
        <GlassPanel
          padding={false}
          glow="gold"
          className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RCBadge />
          <ChevronDown className="h-3 w-3 text-white/30" />
        </GlassPanel>

        {/* Deposit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDepositOpen(true)}
          className="rounded-xl bg-gradient-to-r from-gold to-amber-500 px-4 py-2 text-xs font-bold text-obsidian transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
        >
          DEPOSIT
        </motion.button>

        {/* Profile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors hover:border-gold/20 hover:text-gold"
        >
          <User className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.header>
    </>
  );
}
