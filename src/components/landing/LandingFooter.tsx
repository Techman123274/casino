"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Lock, Fingerprint } from "lucide-react";

const trustBadges = [
  { icon: Shield, label: "Provably Fair" },
  { icon: Lock, label: "256-bit Encryption" },
  { icon: Fingerprint, label: "Biometric 2FA" },
];

export function LandingFooter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer ref={ref} className="relative px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      {/* Final CTA banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-20 max-w-3xl overflow-hidden rounded-3xl border border-gold/10 bg-gradient-to-br from-gold/[0.04] via-transparent to-matrix/[0.02] p-8 text-center sm:p-12"
      >
        <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
          Ready to play at the speed of light?
        </h2>
        <p className="mb-8 text-sm text-white/30">
          Join 48,000+ players. Instant deposits. Instant withdrawals. No BS.
        </p>
        <Link href="/register">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="cta-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold px-10 py-4 text-sm font-bold uppercase tracking-widest text-obsidian"
          >
            CREATE ACCOUNT
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </Link>
      </motion.div>

      {/* Trust row */}
      <div className="mx-auto mb-12 flex max-w-md items-center justify-center gap-6 sm:gap-10">
        {trustBadges.map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center gap-2 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <badge.icon className="h-4 w-4 text-gold/40" />
            </div>
            <span className="text-[10px] text-white/20">{badge.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-6xl border-t border-white/[0.04] pt-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/10 text-gold">
              <span className="text-xs font-bold">R</span>
            </div>
            <span className="text-xs font-semibold text-white/20 tracking-wider">
              RAPID ROLE
            </span>
          </div>
          <div className="flex gap-6 text-[11px] text-white/15">
            <Link href="#" className="transition-colors hover:text-white/40">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-white/40">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-white/40">
              Responsible Gaming
            </Link>
            <Link href="#" className="transition-colors hover:text-white/40">
              Support
            </Link>
          </div>
          <span className="text-[11px] text-white/10">
            &copy; 2026 RAPID ROLE. Play responsibly. 18+
          </span>
        </div>
      </div>
    </footer>
  );
}
