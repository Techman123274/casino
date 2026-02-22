"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";

function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

const DISMISS_KEY = "rr-ios-prompt-dismissed";

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) return;
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-4 bottom-6 z-[80] overflow-hidden rounded-2xl border border-gold/[0.12] bg-obsidian/90 backdrop-blur-[30px] md:hidden safe-area-bottom"
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <span className="text-lg font-black text-gold">R</span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                Get the full experience
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
                Tap{" "}
                <Share className="inline h-3 w-3 text-gold/60" />{" "}
                then{" "}
                <span className="inline-flex items-center gap-0.5 text-gold/60">
                  <Plus className="inline h-3 w-3" /> Add to Home Screen
                </span>{" "}
                for a native app feel.
              </p>
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1 text-white/20 transition-colors hover:text-white/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
