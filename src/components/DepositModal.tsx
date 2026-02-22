"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useBalanceStore } from "@/stores/balance-store";
import { testDeposit } from "@/actions/deposit";
import { RC_ICON, RC_SYMBOL, formatRCValue } from "@/lib/currency";

const PRESETS = [100, 500, 1_000, 5_000, 10_000, 50_000];

type DepositState = "idle" | "loading" | "success" | "error";

export function DepositModal({ onClose }: { onClose: () => void }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { credits, setCredits } = useBalanceStore();
  const [amount, setAmount] = useState<number>(1_000);
  const [customInput, setCustomInput] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [state, setState] = useState<DepositState>("idle");
  const [error, setError] = useState("");
  const [deposited, setDeposited] = useState(0);

  const isAuthed = status === "authenticated" && !!session?.user;
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
            You need an account to deposit Rapid Credits.
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

  const depositContent = isAuthed ? (
    <ModalContent
      credits={credits}
      amount={amount}
      setAmount={setAmount}
      customInput={customInput}
      setCustomInput={setCustomInput}
      useCustom={useCustom}
      setUseCustom={setUseCustom}
      effectiveAmount={effectiveAmount}
      isValid={isValid}
      state={state}
      error={error}
      deposited={deposited}
      onDeposit={handleDeposit}
      onClose={onClose}
    />
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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm"
        />

        {/* Desktop modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 mx-4 hidden w-full max-w-md md:block"
        >
          {depositContent}
        </motion.div>

        {/* Mobile drawer */}
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
            {depositContent}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalContent({
  credits,
  amount,
  setAmount,
  customInput,
  setCustomInput,
  useCustom,
  setUseCustom,
  effectiveAmount,
  isValid,
  state,
  error,
  deposited,
  onDeposit,
  onClose,
}: {
  credits: string;
  amount: number;
  setAmount: (n: number) => void;
  customInput: string;
  setCustomInput: (s: string) => void;
  useCustom: boolean;
  setUseCustom: (b: boolean) => void;
  effectiveAmount: number;
  isValid: boolean;
  state: DepositState;
  error: string;
  deposited: number;
  onDeposit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gold/[0.12] bg-obsidian/90 backdrop-blur-[40px]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
              <ArrowDownToLine className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deposit Credits</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                <FlaskConical className="h-3 w-3 text-matrix" />
                Test Mode — instant, unlimited
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

        {/* Current balance */}
        <div className="mb-6 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <span className="text-[10px] uppercase tracking-widest text-white/20">
            Current Balance
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg text-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]">
              {RC_ICON}
            </span>
            <span className="text-2xl font-bold tabular-nums text-gold">
              {formatRCValue(credits)}
            </span>
            <span className="text-sm text-gold/40">{RC_SYMBOL}</span>
          </div>
        </div>

        {/* Preset amounts */}
        <div className="mb-4">
          <span className="mb-2 block text-[10px] uppercase tracking-widest text-white/20">
            Quick Select
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <motion.button
                key={preset}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setAmount(preset);
                  setUseCustom(false);
                }}
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
        <div className="mb-6">
          <span className="mb-2 block text-[10px] uppercase tracking-widest text-white/20">
            Custom Amount
          </span>
          <div
            className={`flex items-center gap-2 rounded-xl border bg-white/[0.02] px-4 transition-all ${
              useCustom
                ? "border-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.05)]"
                : "border-white/[0.06]"
            }`}
          >
            <span className="text-sm text-gold/40">{RC_ICON}</span>
            <input
              type="number"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setUseCustom(true);
              }}
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

        {/* Summary line */}
        {isValid && state === "idle" && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-2.5 text-xs">
            <span className="text-white/25">You will receive</span>
            <span className="font-semibold text-gold">
              +{effectiveAmount.toLocaleString()} {RC_SYMBOL}
            </span>
          </div>
        )}

        {/* Deposit button */}
        <motion.button
          whileHover={state === "idle" && isValid ? { scale: 1.02 } : {}}
          whileTap={state === "idle" && isValid ? { scale: 0.97 } : {}}
          onClick={state === "idle" ? onDeposit : undefined}
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
            <>
              <Check className="h-4 w-4" />
              +{deposited.toLocaleString()} RC DEPOSITED
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              DEPOSIT {isValid ? effectiveAmount.toLocaleString() : ""} RC
            </>
          )}
        </motion.button>

        {/* Test mode notice */}
        <p className="mt-4 text-center text-[10px] text-white/15">
          Test phase — credits have no monetary value. Deposits are instant and free.
        </p>
      </div>
    </div>
  );
}
