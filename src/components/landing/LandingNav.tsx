"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "The Vault", href: "#vault" },
  { label: "Live Ledger", href: "#ledger" },
  { label: "Compare", href: "#compare" },
  { label: "Games", href: "/dashboard" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
    setShowCta(latest > 600);
  });

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.06] bg-obsidian/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <span className="text-lg font-bold">R</span>
            </div>
            <span className="text-gradient-gold text-base font-bold tracking-wider">
              RAPID ROLE
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] font-medium uppercase tracking-widest text-white/30 transition-colors hover:text-white/70"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2 text-xs font-medium text-white/50 transition-all hover:border-white/[0.15] hover:text-white/80"
              >
                LOG IN
              </motion.button>
            </Link>

            {/* Sticky CTA — appears after scrolling past hero */}
            <AnimatePresence>
              {showCta ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.9, width: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-5 py-2 text-xs font-bold text-obsidian transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                    >
                      ENTER THE ARENA
                      <ArrowRight className="h-3 w-3" />
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-xl bg-gradient-to-r from-gold to-amber-500 px-5 py-2 text-xs font-bold text-obsidian transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                  >
                    SIGN UP
                  </motion.button>
                </Link>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] text-white/40 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col bg-obsidian/95 backdrop-blur-xl pt-20 md:hidden"
          >
            <div className="flex flex-col gap-2 px-6 py-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-4 text-lg font-medium text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-3 px-6 pb-8">
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-amber-500 py-4 text-base font-bold uppercase tracking-widest text-obsidian">
                  ENTER THE ARENA
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <button className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 text-base font-medium text-white/50">
                  LOG IN
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
