"use client";

import { motion } from "framer-motion";
import { JackpotOdometer } from "@/components/JackpotOdometer";
import { GameLobby } from "@/components/GameCard";
import { GlassPanel } from "@/components/GlassPanel";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <JackpotOdometer />

      {/* Bento-Grid HUD tab nav */}
      <GlassPanel
        glow="gold"
        padding={false}
        className="my-6 flex items-center gap-2 p-2 neon-border matrix-rain-bg"
      >
        {["All Games", "Originals", "Live Casino", "Slots", "Table Games"].map(
          (tab, i) => (
            <motion.button
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative z-10 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                i === 0
                  ? "bg-gold/10 text-gold border border-gold/20 shadow-[0_0_12px_rgba(255,215,0,0.1)]"
                  : "border border-white/[0.04] bg-white/[0.02] text-white/30 hover:bg-white/[0.05] hover:text-white/50"
              }`}
            >
              {tab}
            </motion.button>
          )
        )}
      </GlassPanel>

      <GameLobby />
    </div>
  );
}
