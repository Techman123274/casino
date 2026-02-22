"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { X, Fingerprint, Chrome, Wallet, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { AuthInput } from "./AuthInput";
import Link from "next/link";

type AuthState = "idle" | "loading" | "error" | "success";

const shakeVariants = {
  shake: {
    x: [0, -12, 12, -8, 8, -4, 4, 0],
    transition: { duration: 0.5 },
  },
};

const goldPulseVariants = {
  pulse: {
    boxShadow: [
      "0 0 0px rgba(255, 215, 0, 0)",
      "0 0 60px rgba(255, 215, 0, 0.4)",
      "0 0 120px rgba(255, 215, 0, 0.2)",
      "0 0 0px rgba(255, 215, 0, 0)",
    ],
    transition: { duration: 0.8 },
  },
};

interface LoginModalProps {
  isIntercepted?: boolean;
}

export function LoginModal({ isIntercepted = false }: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Mobile drawer drag
  const dragY = useMotionValue(0);
  const drawerOpacity = useTransform(dragY, [0, 300], [1, 0.2]);

  const emailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  const close = useCallback(() => {
    if (isIntercepted) {
      router.back();
    } else {
      router.push("/");
    }
  }, [isIntercepted, router]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120) close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !passwordValid) {
      setAuthState("error");
      setErrorMsg("Please fill in all fields correctly.");
      setTimeout(() => setAuthState("idle"), 600);
      return;
    }

    setAuthState("loading");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setAuthState("error");
      setErrorMsg("Invalid credentials. Try again.");
      setTimeout(() => setAuthState("idle"), 600);
      return;
    }

    setAuthState("success");
    setTimeout(() => window.location.href = "/dashboard", 900);
  };

  const handlePasskey = async () => {
    setAuthState("loading");
    await new Promise((r) => setTimeout(r, 2000));
    setAuthState("success");
    setTimeout(() => window.location.href = "/dashboard", 900);
  };

  // Desktop modal content
  const modalContent = (
    <motion.div
      variants={shakeVariants}
      animate={authState === "error" ? "shake" : undefined}
      className="w-full"
    >
      <motion.div
        variants={goldPulseVariants}
        animate={authState === "success" ? "pulse" : undefined}
        className={`
          relative w-full overflow-hidden rounded-3xl border
          bg-obsidian/80 backdrop-blur-[40px]
          transition-colors duration-500
          ${authState === "success"
            ? "border-gold/40"
            : "border-gold/[0.12]"
          }
        `}
      >
        {/* Gold accent line at top */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-white/30">
                Enter the arena. Your vault awaits.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/30 transition-colors hover:border-white/[0.1] hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Passkey — Primary 2026 auth */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePasskey}
            disabled={authState === "loading"}
            className="group mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/[0.08] to-gold/[0.04] py-4 text-sm font-semibold text-gold transition-all hover:border-gold/30 hover:from-gold/[0.12] hover:to-gold/[0.06] disabled:opacity-50"
          >
            {authState === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Fingerprint className="h-5 w-5" />
                Sign in with Passkey
              </>
            )}
          </motion.button>

          {/* Social row */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-xs font-medium text-white/40 transition-all hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/70"
            >
              <Chrome className="h-4 w-4" />
              Google
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-xs font-medium text-white/40 transition-all hover:border-purple-500/20 hover:bg-purple-500/[0.04] hover:text-purple-300"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </motion.button>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.04]" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/15">
              or use email
            </span>
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthInput
              label="Email"
              icon={Mail}
              type="email"
              placeholder="you@arena.gg"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
              valid={emailValid}
              error={authState === "error" && !emailValid ? "Valid email required" : undefined}
              autoComplete="email"
            />
            <AuthInput
              label="Password"
              icon={Lock}
              isPassword
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
              valid={passwordValid}
              error={authState === "error" && !passwordValid ? "Min 8 characters" : undefined}
              autoComplete="current-password"
            />

            {/* Global error */}
            <AnimatePresence>
              {errorMsg && authState !== "error" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-xs text-red-400/70"
                >
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={authState === "loading" || authState === "success"}
              className={`
                group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4
                text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50
                ${authState === "success"
                  ? "bg-matrix/20 text-matrix border border-matrix/20"
                  : "bg-gradient-to-r from-gold via-amber-400 to-gold text-obsidian cta-glow"
                }
              `}
            >
              {authState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : authState === "success" ? (
                "ACCESS GRANTED"
              ) : (
                <>
                  ENTER THE ARENA
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-white/20">
            No account?{" "}
            <Link
              href="/register"
              className="font-medium text-gold/50 transition-colors hover:text-gold"
            >
              Create one in 10 seconds
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  // Responsive: drawer on mobile, centered modal on desktop
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm"
        />

        {/* Desktop: centered spring modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 mx-4 hidden w-full max-w-md md:block"
        >
          {modalContent}
        </motion.div>

        {/* Mobile: bottom drawer */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ y: dragY, opacity: drawerOpacity }}
          className="fixed inset-x-0 bottom-0 z-10 md:hidden"
        >
          {/* Drag handle */}
          <div className="flex justify-center pb-2 pt-3">
            <div className="h-1 w-10 rounded-full bg-white/15" />
          </div>
          <div className="max-h-[90svh] overflow-y-auto rounded-t-3xl">
            {modalContent}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
