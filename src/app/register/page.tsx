"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Mail, Lock, User, Fingerprint, Chrome, Wallet } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const emailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const usernameValid = username.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1000);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 900);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-md"
      >
        <div className="overflow-hidden rounded-3xl border border-gold/[0.12] bg-obsidian/80 backdrop-blur-[40px]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          <div className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Create your identity
              </h2>
              <p className="mt-1 text-sm text-white/30">
                10 seconds. Zero KYC. Full access.
              </p>
            </div>

            {/* Passkey */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/[0.08] to-gold/[0.04] py-4 text-sm font-semibold text-gold transition-all hover:border-gold/30"
            >
              <Fingerprint className="h-5 w-5" />
              Register with Passkey
            </motion.button>

            {/* Social */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-xs font-medium text-white/40 transition-all hover:border-white/[0.12] hover:text-white/70"
              >
                <Chrome className="h-4 w-4" />
                Google
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-xs font-medium text-white/40 transition-all hover:border-purple-500/20 hover:text-purple-300"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </motion.button>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/15">
                or use email
              </span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AuthInput
                label="Username"
                icon={User}
                placeholder="anon_ghost"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                valid={usernameValid}
                autoComplete="username"
              />
              <AuthInput
                label="Email"
                icon={Mail}
                type="email"
                placeholder="you@arena.gg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                valid={emailValid}
                autoComplete="email"
              />
              <AuthInput
                label="Password"
                icon={Lock}
                isPassword
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                valid={passwordValid}
                autoComplete="new-password"
              />

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center text-xs text-red-400/80"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || success}
                className={`group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                  success
                    ? "border border-matrix/20 bg-matrix/20 text-matrix"
                    : "bg-gradient-to-r from-gold via-amber-400 to-gold text-obsidian cta-glow"
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  "IDENTITY CREATED"
                ) : (
                  <>
                    CREATE ACCOUNT
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-[11px] text-white/20">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-gold/50 transition-colors hover:text-gold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
