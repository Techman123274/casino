"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  glow?: "gold" | "matrix" | "none";
  padding?: boolean;
}

export function GlassPanel({
  children,
  className,
  glow = "gold",
  padding = true,
  ...props
}: GlassPanelProps) {
  return (
    <motion.div
      className={clsx(
        "rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl",
        "transition-all duration-300 ease-out",
        glow === "gold" && "gold-glow-hover",
        glow === "matrix" && "hover:shadow-[0_0_30px_rgba(0,255,65,0.12)]",
        padding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
