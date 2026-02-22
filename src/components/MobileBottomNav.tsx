"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Gamepad2, Wallet, User } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const items: NavItem[] = [
  { icon: Lock, label: "Home", href: "/dashboard" },
  { icon: Gamepad2, label: "Games", href: "/dashboard/originals" },
  { icon: Wallet, label: "Wallet", href: "/dashboard/promotions" },
  { icon: User, label: "Profile", href: "/dashboard/settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => triggerHaptic("light")}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute -top-1 h-0.5 w-6 rounded-full bg-gold"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 transition-colors ${
                  active
                    ? "text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                    : "text-white/25"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-gold" : "text-white/20"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
