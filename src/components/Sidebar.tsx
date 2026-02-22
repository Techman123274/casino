"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Radio,
  Gamepad2,
  Swords,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Gift,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string | null;
}

const navItems: NavItem[] = [
  { icon: Lock, label: "Vault", href: "/dashboard" },
  { icon: Radio, label: "Live Floor", href: "/dashboard/live", badge: "LIVE" },
  { icon: Gamepad2, label: "Originals", href: "/dashboard/originals", badge: "NEW" },
  { icon: Swords, label: "PvP", href: "/dashboard/pvp" },
  { icon: Terminal, label: "Terminal", href: "/dashboard/terminal" },
];

const secondaryItems: NavItem[] = [
  { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard" },
  { icon: Gift, label: "Promotions", href: "/dashboard/promotions" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: expanded ? 200 : 72 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full flex-col border-r border-white/[0.06] bg-white/[0.015] backdrop-blur-md"
    >
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex h-10 items-center justify-center border-b border-white/[0.04] text-white/20 transition-colors hover:text-white/50"
      >
        {expanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Primary Nav */}
      <div className="flex flex-1 flex-col gap-1 p-2 pt-4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`
                  group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                  transition-all duration-200 cursor-pointer
                  ${active
                    ? "bg-gold/[0.08] text-gold"
                    : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
                  }
                `}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-gold/20 bg-gold/[0.06]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`relative z-10 h-5 w-5 shrink-0 ${active ? "drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" : ""}`} />

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.badge && !expanded && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-matrix opacity-40" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-matrix" />
                  </span>
                )}

                {item.badge && expanded && (
                  <span className="relative z-10 ml-auto rounded-full bg-matrix/10 px-1.5 py-0.5 text-[9px] font-bold text-matrix">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3 h-px bg-white/[0.04]" />

        {/* Secondary */}
        {secondaryItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer
                  transition-colors duration-200
                  ${active
                    ? "bg-gold/[0.06] text-gold"
                    : "text-white/20 hover:bg-white/[0.04] hover:text-white/40"
                  }
                `}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${active ? "drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" : ""}`} />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] p-3">
        <AnimatePresence>
          {expanded ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-white/10 text-center"
            >
              RAPID ROLE v0.1.0
            </motion.p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              className="text-center text-[10px] text-white font-bold"
            >
              RR
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
