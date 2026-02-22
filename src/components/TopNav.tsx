"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  User,
  Gift,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassPanel } from "./GlassPanel";
import { DepositModal } from "./DepositModal";
import { useBalanceStore } from "@/stores/balance-store";
import {
  useWalletStore,
  CURRENCIES,
  type Currency,
} from "@/stores/wallet-store";
import { formatRCValue, RC_ICON, RC_SYMBOL } from "@/lib/currency";
import { triggerHaptic } from "@/lib/haptics";
import { claimDailyCredits, getFaucetStatus } from "@/actions/faucet";

/* ═══════════════════════════════════════════════
   ROLLING DIGIT ANIMATION
   ═══════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════
   WALLET BADGE (multi-currency aware)
   ═══════════════════════════════════════════════ */

function WalletBadge() {
  const { activeCurrency, balances, pulseKey } = useWalletStore();
  const { credits } = useBalanceStore();

  const cfg = CURRENCIES[activeCurrency];
  const rawBalance =
    activeCurrency === "RC" ? credits : balances[activeCurrency];
  const display =
    activeCurrency === "RC" ? formatRCValue(rawBalance) : rawBalance;
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

      <span
        className="text-base drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
        style={{ color: cfg.color }}
      >
        {cfg.icon}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] leading-none text-white/35">
          {cfg.label}
        </span>
        <span
          key={rawBalance}
          className="text-sm font-bold tabular-nums drop-shadow-[0_0_6px_rgba(255,215,0,0.3)]"
          style={{ color: cfg.color }}
        >
          <AnimatePresence mode="popLayout">
            {digits.map((d, i) => (
              <RollingDigit key={`${i}-${d}`} digit={d} index={i} />
            ))}
          </AnimatePresence>{" "}
          <span className="text-[10px] font-semibold" style={{ color: cfg.color, opacity: 0.5 }}>
            {cfg.symbol}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CURRENCY SWITCHER DROPDOWN
   ═══════════════════════════════════════════════ */

function CurrencySwitcher() {
  const { activeCurrency, setActiveCurrency, balances } = useWalletStore();
  const { credits } = useBalanceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currencies: Currency[] = ["RC", "BTC", "ETH"];

  return (
    <div ref={ref} className="relative">
      <GlassPanel
        padding={false}
        glow="gold"
        className="flex cursor-pointer items-center gap-2 px-3 py-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
      >
        <WalletBadge />
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3 w-3 text-white/30" />
        </motion.div>
      </GlassPanel>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-obsidian/95 backdrop-blur-xl"
          >
            <div className="p-1.5">
              {currencies.map((c) => {
                const cfg = CURRENCIES[c];
                const bal = c === "RC" ? credits : balances[c];
                const isActive = c === activeCurrency;
                return (
                  <motion.button
                    key={c}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      setActiveCurrency(c);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "bg-white/[0.06] border border-gold/15"
                        : "border border-transparent hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        color: cfg.color,
                      }}
                    >
                      {cfg.icon}
                    </span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-xs font-semibold text-white/70">{cfg.label}</span>
                      <span
                        className="font-mono text-[11px] font-bold tabular-nums"
                        style={{ color: cfg.color }}
                      >
                        {c === "RC" ? formatRCValue(bal) : bal} {cfg.symbol}
                      </span>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FAUCET BUTTON
   ═══════════════════════════════════════════════ */

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
      triggerHaptic("medium");
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

/* ═══════════════════════════════════════════════
   NOTIFICATION PANEL
   ═══════════════════════════════════════════════ */

function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2 text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/70"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-matrix" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/[0.08] bg-obsidian/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                Notifications
              </span>
              <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/50">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-center text-[11px] text-white/20 py-6">
                No new notifications
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SEARCH OVERLAY
   ═══════════════════════════════════════════════ */

function SearchBar() {
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = (e.target as HTMLInputElement).value.trim();
      if (q) router.push(`/dashboard/originals?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="mx-8 hidden max-w-md flex-1 md:flex">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search games, providers..."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-xl border bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-white/70 placeholder:text-white/20 outline-none transition-all ${
            focused
              ? "border-gold/30 bg-white/[0.05] shadow-[0_0_20px_rgba(255,215,0,0.05)]"
              : "border-white/[0.06]"
          }`}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOP NAV (MAIN EXPORT)
   ═══════════════════════════════════════════════ */

export function TopNav() {
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <>
      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 backdrop-blur-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
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
          </Link>
        </div>

        {/* Center: Search */}
        <SearchBar />

        {/* Right: Faucet + Notifications + Wallet + Deposit + Profile */}
        <div className="flex items-center gap-3">
          <FaucetButton />
          <NotificationPanel />

          {/* Multi-Currency Wallet Switcher */}
          <CurrencySwitcher />

          {/* Deposit Button with golden-gradient pulse */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDepositOpen(true)}
            className="deposit-pulse relative overflow-hidden rounded-xl bg-gradient-to-r from-gold to-amber-500 px-4 py-2 text-xs font-bold text-obsidian transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
          >
            <span className="relative z-10">DEPOSIT</span>
          </motion.button>

          {/* Profile */}
          <Link href="/dashboard/settings">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors hover:border-gold/20 hover:text-gold"
            >
              <User className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </motion.header>
    </>
  );
}
