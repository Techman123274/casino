"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

function OdometerDigit({ digit }: { digit: string }) {
  return (
    <div className="relative h-[1.2em] w-[0.7em] overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center font-mono font-bold tabular-nums"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function formatJackpot(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function JackpotOdometer() {
  const [jackpot, setJackpot] = useState(1_847_293.45);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setJackpot((prev) => prev + Math.random() * 15 + 2);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatted = formatJackpot(jackpot);
  const chars = formatted.split("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-gold/10 bg-gradient-to-br from-gold/[0.04] via-transparent to-matrix/[0.02] p-6 md:p-8"
    >
      {/* Animated glow orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-gold/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-matrix/[0.03] blur-3xl" />

      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-gold" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gold/60">
            Rapid Jackpot
          </span>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-auto flex items-center gap-1 text-[10px] text-matrix"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-matrix" />
            LIVE
          </motion.span>
        </div>

        {/* Odometer display */}
        <div className="flex items-baseline gap-0.5">
          <span className="mr-1 text-2xl text-gold/40">$</span>
          <div className="flex text-4xl md:text-5xl text-gold">
            {chars.map((char, i) => (
              char === "," || char === "." ? (
                <span key={`sep-${i}`} className="mx-0.5 text-gold/30">
                  {char}
                </span>
              ) : (
                <OdometerDigit key={`d-${i}`} digit={char} />
              )
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-4 flex gap-6 border-t border-white/[0.04] pt-4">
          {[
            { label: "24h Volume", value: "$2.4M", color: "text-white/60" },
            { label: "Active Players", value: "12,847", color: "text-matrix" },
            { label: "Last Win", value: "$4,291.00", color: "text-gold" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-white/20">
                {stat.label}
              </span>
              <span className={`text-sm font-semibold ${stat.color}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
