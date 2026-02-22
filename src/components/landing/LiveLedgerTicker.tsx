"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Terminal, TrendingUp, Flame } from "lucide-react";

interface WinEntry {
  id: number;
  user: string;
  game: string;
  multiplier: string;
  payout: string;
  isMega: boolean;
}

const usernames = [
  "Ghost_0x9f", "CryptoViper", "NeonPhantom", "User_99", "Anon_43k",
  "DarkMatter", "QuantumBet", "ZeroGravity", "CyberWolf_x", "MatrixRunner",
  "ShadowAce", "NightOwl_7", "PhantomX99", "BlockHash_B", "LuckyNode",
  "ByteKing", "Void_Walker", "HexMaster", "NebulaFox", "CipherPunk",
];

const gameNames = ["Mines", "Crash", "Plinko", "Dice"];

function randomWin(id: number): WinEntry {
  const mult = (Math.random() * 500 + 1.5).toFixed(1);
  const payout = (parseFloat(mult) * (Math.random() * 50 + 5)).toFixed(2);
  const isMega = parseFloat(mult) > 100;
  return {
    id,
    user: usernames[Math.floor(Math.random() * usernames.length)],
    game: gameNames[Math.floor(Math.random() * gameNames.length)],
    multiplier: `${mult}x`,
    payout: `$${Number(payout).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    isMega,
  };
}

function TickerLine({ entry }: { entry: WinEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        flex items-start gap-3 rounded-xl border px-4 py-3 font-mono text-[12px] leading-relaxed sm:text-[13px]
        ${entry.isMega
          ? "border-gold/20 bg-gold/[0.04]"
          : "border-white/[0.04] bg-white/[0.02]"
        }
      `}
    >
      {entry.isMega ? (
        <Flame className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      ) : (
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-matrix/60" />
      )}
      <span className="flex-1 min-w-0">
        <span className={entry.isMega ? "font-bold text-gold" : "text-matrix"}>
          [SUCCESS]
        </span>{" "}
        <span className="text-white/60">{entry.user}</span>{" "}
        <span className="text-white/20">hit</span>{" "}
        <span className={entry.isMega ? "font-bold text-gold" : "text-matrix"}>
          {entry.multiplier}
        </span>{" "}
        <span className="text-white/20">on</span>{" "}
        <span className="text-white/50 uppercase">{entry.game}</span>{" "}
        <span className={`font-semibold ${entry.isMega ? "text-gold" : "text-matrix"}`}>
          (+{entry.payout})
        </span>
      </span>
    </motion.div>
  );
}

export function LiveLedgerTicker() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [entries, setEntries] = useState<WinEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    const initial = Array.from({ length: 6 }, () => {
      idRef.current += 1;
      return randomWin(idRef.current);
    });
    setEntries(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      idRef.current += 1;
      const win = randomWin(idRef.current);
      setEntries((prev) => [win, ...prev].slice(0, 8));
    }, 2800);
    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <section
      ref={sectionRef}
      id="ledger"
      className="relative flex min-h-[100svh] items-center px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-matrix/10 to-transparent" />

      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-matrix/15 bg-matrix/[0.04] px-3 py-1 backdrop-blur-sm">
            <Terminal className="h-3 w-3 text-matrix/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-matrix/60">
              Real-time Feed
            </span>
          </div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            The Live Ledger
          </h2>
          <p className="mx-auto max-w-md text-sm text-white/30">
            Every win. Every payout. Verified on-chain and streamed live.
          </p>
        </motion.div>

        {/* Terminal window */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
        >
          {/* Terminal bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-matrix/60" />
            </div>
            <div className="ml-3 flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-matrix/50" />
              <span className="font-mono text-[10px] text-white/20">
                rapid-role://ledger --live --verified
              </span>
            </div>
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-auto flex items-center gap-1.5 text-[10px] text-matrix"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-matrix" />
              LIVE
            </motion.span>
          </div>

          {/* Entries */}
          <div className="flex flex-col gap-2 p-3">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <TickerLine key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>

          {/* Terminal footer */}
          <div className="border-t border-white/[0.04] px-4 py-2">
            <span className="font-mono text-[10px] text-white/10">
              {">"} Streaming {entries.length} verified transactions...
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
