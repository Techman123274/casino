"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  ArrowDownToLine,
  Loader2,
  Check,
  AlertTriangle,
  FlaskConical,
  LogIn,
  Copy,
  Wallet,
} from "lucide-react";
import { useBalanceStore } from "@/stores/balance-store";
import { useWalletStore, CURRENCIES, type Currency } from "@/stores/wallet-store";
import { testDeposit } from "@/actions/deposit";
import { RC_ICON, RC_SYMBOL, formatRCValue } from "@/lib/currency";

const PRESETS = [100, 500, 1_000, 5_000, 10_000, 50_000];

type DepositState = "idle" | "loading" | "success" | "error";
type DepositTab = "RC" | "BTC" | "ETH";

function generateMockAddress(currency: "BTC" | "ETH"): string {
  const chars = "0123456789abcdef";
  if (currency === "BTC") {
    const body = Array.from({ length: 33 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    return `bc1q${body}`;
  }
  const body = Array.from({ length: 40 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `0x${body}`;
}

export function DepositModal({ onClose }: { onClose: () => void }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { credits, setCredits } = useBalanceStore();
  const { activeCurrency } = useWalletStore();
  const [tab, setTab] = useState<DepositTab>(activeCurrency === "ETH" ? "ETH" : activeCurrency === "BTC" ? "BTC" : "RC");

  const isAuthed = status === "authenticated" && !!session?.user;

  const handleSignIn = () => {
    onClose();
    router.push("/login");
  };

  const signInScreen = (
    <div className="w-full overflow-hidden rounded-3xl border border-gold/[0.12] bg-obsidian/90 backdrop-blur-[40px]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="flex flex-col items-center gap-5 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/15 bg-gold/[0.06]">
          <LogIn className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Sign in required</h2>
          <p className="mt-1 text-sm text-white/30">
            You need an account to deposit.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold py-4 text-sm font-bold uppercase tracking-widest text-obsidian cta-glow"
          >
            <LogIn className="h-4 w-4" />
            SIGN IN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] py-3 text-xs text-white/30 transition-colors hover:text-white/60"
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </div>
  );

  const tabs: DepositTab[] = ["RC", "BTC", "ETH"];

  const content = isAuthed ? (
    <div className="w-full overflow-hidden rounded-3xl border border-gold/[0.12] bg-obsidian/90 backdrop-blur-[40px]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
              <ArrowDownToLine className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deposit</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                <Wallet className="h-3 w-3 text-gold/50" />
                Multi-currency wallet
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Tab selector */}
        <div className="mb-5 flex gap-1 rounded-xl bg-white/[0.03] p-1">
          {tabs.map((t) => {
            const cfg = CURRENCIES[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  tab === t
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                <span style={{ color: tab === t ? cfg.color : undefined }}>{cfg.icon}</span>
                {cfg.symbol}
              </button>
            );
          })}
        </div>

        {/* Tab body */}
        <AnimatePresence mode="wait">
          {tab === "RC" ? (
            <motion.div key="rc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <RCDepositTab credits={credits} setCredits={setCredits} onClose={onClose} />
            </motion.div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <CryptoDepositTab currency={tab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  ) : (
    signInScreen
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 mx-4 hidden w-full max-w-md md:block"
        >
          {content}
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-10 md:hidden"
        >
          <div className="flex justify-center pb-2 pt-3">
            <div className="h-1 w-10 rounded-full bg-white/15" />
          </div>
          <div className="max-h-[90svh] overflow-y-auto rounded-t-3xl">
            {content}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════
   RC (Test Credits) DEPOSIT TAB
   ═══════════════════════════════════════════════ */

function RCDepositTab({
  credits,
  setCredits,
  onClose,
}: {
  credits: string;
  setCredits: (c: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState<number>(1_000);
  const [customInput, setCustomInput] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [state, setState] = useState<DepositState>("idle");
  const [error, setError] = useState("");
  const [deposited, setDeposited] = useState(0);

  const effectiveAmount = useCustom ? parseFloat(customInput) || 0 : amount;
  const isValid = effectiveAmount >= 10 && effectiveAmount <= 100_000;

  const handleDeposit = async () => {
    if (!isValid) return;
    setState("loading");
    setError("");

    const result = await testDeposit(effectiveAmount);

    if (!result.ok) {
      setState("error");
      setError(result.error || "Deposit failed");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    setCredits(result.credits!);
    setDeposited(result.deposited!);
    setState("success");
  };

  return (
    <>
      {/* Current balance */}
      <div className="mb-5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        <span className="text-[10px] uppercase tracking-widest text-white/20">Current Balance</span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg text-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]">{RC_ICON}</span>
          <span className="text-2xl font-bold tabular-nums text-gold">{formatRCValue(credits)}</span>
          <span className="text-sm text-gold/40">{RC_SYMBOL}</span>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-white/20">Quick Select</span>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <motion.button
              key={preset}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setAmount(preset); setUseCustom(false); }}
              className={`rounded-xl border py-3 text-center text-sm font-semibold tabular-nums transition-all ${
                !useCustom && amount === preset
                  ? "border-gold/25 bg-gold/10 text-gold shadow-[0_0_15px_rgba(255,215,0,0.06)]"
                  : "border-white/[0.04] bg-white/[0.02] text-white/30 hover:border-white/[0.1] hover:text-white/60"
              }`}
            >
              {preset.toLocaleString()}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div className="mb-5">
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-white/20">Custom Amount</span>
        <div className={`flex items-center gap-2 rounded-xl border bg-white/[0.02] px-4 transition-all ${
          useCustom ? "border-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.05)]" : "border-white/[0.06]"
        }`}>
          <span className="text-sm text-gold/40">{RC_ICON}</span>
          <input
            type="number"
            value={customInput}
            onChange={(e) => { setCustomInput(e.target.value); setUseCustom(true); }}
            onFocus={() => setUseCustom(true)}
            placeholder="Enter amount (10 - 100,000)"
            min={10}
            max={100000}
            className="w-full bg-transparent py-3 text-sm tabular-nums text-white/70 placeholder:text-white/15 outline-none"
          />
          <span className="text-xs text-white/20">{RC_SYMBOL}</span>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && state === "error" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-2.5 text-xs text-red-400/80"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {isValid && state === "idle" && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-2.5 text-xs">
          <span className="text-white/25">You will receive</span>
          <span className="font-semibold text-gold">+{effectiveAmount.toLocaleString()} {RC_SYMBOL}</span>
        </div>
      )}

      {/* Action */}
      <motion.button
        whileHover={state === "idle" && isValid ? { scale: 1.02 } : {}}
        whileTap={state === "idle" && isValid ? { scale: 0.97 } : {}}
        onClick={state === "idle" ? handleDeposit : undefined}
        disabled={!isValid || state === "loading" || state === "success"}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
          state === "success"
            ? "border border-matrix/20 bg-matrix/20 text-matrix"
            : "bg-gradient-to-r from-gold via-amber-400 to-gold text-obsidian cta-glow"
        }`}
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "success" ? (
          <><Check className="h-4 w-4" />+{deposited.toLocaleString()} RC DEPOSITED</>
        ) : (
          <><Zap className="h-4 w-4" />DEPOSIT {isValid ? effectiveAmount.toLocaleString() : ""} RC</>
        )}
      </motion.button>

      <p className="mt-4 text-center text-[10px] text-white/15">
        <FlaskConical className="mr-1 inline h-3 w-3 text-matrix" />
        Test phase — credits have no monetary value.
      </p>
    </>
  );
}

/* ═══════════════════════════════════════════════
   CRYPTO DEPOSIT TAB (BTC / ETH)
   ═══════════════════════════════════════════════ */

function CryptoDepositTab({ currency }: { currency: "BTC" | "ETH" }) {
  const cfg = CURRENCIES[currency];
  const address = useMemo(() => generateMockAddress(currency), [currency]);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Network info */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-base" style={{ color: cfg.color }}>{cfg.icon}</span>
          <span className="text-sm font-semibold text-white/70">{cfg.label} Deposit</span>
        </div>
        <p className="text-[11px] text-white/30">
          {currency === "BTC" ? "Bitcoin Mainnet (SegWit)" : "Ethereum Mainnet (ERC-20)"}
        </p>
      </div>

      {/* Address */}
      <div>
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-white/20">
          Your Deposit Address
        </span>
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 font-mono text-[11px] text-white/50">
            {address}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyAddress}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/30 transition-colors hover:text-white/60"
          >
            {copied ? <Check className="h-4 w-4 text-matrix" /> : <Copy className="h-4 w-4" />}
          </motion.button>
        </div>
        {copied && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1.5 text-[10px] text-matrix"
          >
            Address copied to clipboard
          </motion.p>
        )}
      </div>

      {/* QR placeholder */}
      <div className="flex flex-col items-center rounded-xl border border-white/[0.04] bg-white/[0.02] p-6">
        <div
          className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed"
          style={{ borderColor: `${cfg.color}30` }}
        >
          <span className="text-4xl" style={{ color: cfg.color }}>{cfg.icon}</span>
        </div>
        <p className="text-[10px] text-white/20">QR code available in production</p>
      </div>

      {/* Minimum deposit */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-2.5 text-xs">
        <span className="text-white/25">Minimum deposit</span>
        <span className="font-mono font-semibold" style={{ color: cfg.color }}>
          {currency === "BTC" ? "0.0001 BTC" : "0.01 ETH"}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-2.5 text-xs">
        <span className="text-white/25">Confirmations</span>
        <span className="font-mono text-white/40">{currency === "BTC" ? "2" : "12"}</span>
      </div>

      <p className="text-center text-[10px] text-white/15">
        <AlertTriangle className="mr-1 inline h-3 w-3 text-amber-400/40" />
        Only send {cfg.label} to this address. Other assets will be lost.
      </p>
    </div>
  );
}
