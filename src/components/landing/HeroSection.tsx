"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";
import { DigitalRain } from "./DigitalRain";

const stats = [
  { icon: Zap, value: "$12.4M+", label: "Paid out this week" },
  { icon: Users, value: "48,000+", label: "Active players" },
  { icon: Shield, value: "100%", label: "Provably fair" },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4">
      {/* Digital Rain BG */}
      <DigitalRain />

      {/* Scan line overlay */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent"
          style={{ animation: "scan-line 8s linear infinite" }}
        />
      </div>

      {/* Radial vignette */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_20%,#020202_80%)]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-4 py-1.5 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-matrix" />
          <span className="text-xs font-medium tracking-wider text-gold/80">
            THE FUTURE OF iGAMING IS HERE
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="glitch-text mb-2 text-5xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          data-text="HIGH STAKES."
        >
          HIGH STAKES.
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-6 text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          <span className="text-gradient-gold">HIGH PERFORMANCE.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto mb-10 max-w-xl text-base text-white/40 sm:text-lg"
        >
          Provably fair. Instant withdrawals. Built for degens who demand
          speed, anonymity, and zero compromise.
        </motion.p>

        {/* CTA cluster — mobile thumb-reach: big tap targets, bottom-stacked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"
        >
          <Link href="/register" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="cta-glow group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold px-8 py-4 text-base font-bold uppercase tracking-widest text-obsidian transition-all sm:w-auto sm:px-10"
            >
              ENTER THE ARENA
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-4 text-base font-medium text-white/50 backdrop-blur-sm transition-all hover:border-gold/20 hover:text-white/80 sm:w-auto sm:px-10"
            >
              Explore Games
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                <stat.icon className="h-4 w-4 text-gold/60" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white/80">
                  {stat.value}
                </p>
                <p className="text-[11px] text-white/25">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-white/15">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-gold/30 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
