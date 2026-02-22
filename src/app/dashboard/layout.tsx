"use client";

import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { TerminalFeed } from "@/components/TerminalFeed";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col overflow-hidden safe-area-top">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 overflow-y-auto hide-scrollbar pb-20 md:pb-0"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <div className="hidden w-[300px] shrink-0 border-l border-white/[0.06] bg-white/[0.01] lg:block">
          <TerminalFeed />
        </div>
      </div>

      {/* Mobile bottom nav — visible only on small screens */}
      <MobileBottomNav />
    </div>
  );
}
