"use client";

import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { TerminalFeed } from "@/components/TerminalFeed";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 overflow-y-auto hide-scrollbar"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <div className="hidden w-[300px] shrink-0 border-l border-white/[0.06] bg-white/[0.01] lg:block">
          <TerminalFeed />
        </div>
      </div>
    </div>
  );
}
