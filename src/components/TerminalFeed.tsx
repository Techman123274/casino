"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  ShieldCheck,
  X,
  Copy,
  Check,
} from "lucide-react";

interface FeedEntry {
  id: number;
  type: "win" | "bet" | "jackpot" | "system";
  user: string;
  game: string;
  amount: string;
  multiplier?: string;
  timestamp: string;
  txId: string;
  seedHash: string;
  serverSeed: string;
}

const users = [
  "Ghost_0x9f", "CryptoViper", "NeonPhantom", "User_772", "Anon_43k",
  "DarkMatter", "QuantumBet", "ZeroGravity", "CyberWolf", "MatrixRunner",
  "ShadowAce", "NightOwl_7", "PhantomX", "BlockChain_B", "LuckyHash",
];

const games = [
  "Mines", "Crash", "Plinko", "Dice", "Towers", "Slots", "Vault",
];

function generateHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function randomEntry(id: number): FeedEntry {
  const isWin = Math.random() > 0.35;
  const isJackpot = Math.random() > 0.95;
  const amount = (Math.random() * 500 + 1).toFixed(2);
  const multiplier = (Math.random() * 50 + 1.1).toFixed(2);

  return {
    id,
    type: isJackpot ? "jackpot" : isWin ? "win" : "bet",
    user: users[Math.floor(Math.random() * users.length)],
    game: games[Math.floor(Math.random() * games.length)],
    amount: `${amount} RC`,
    multiplier: isWin || isJackpot ? `${multiplier}x` : undefined,
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    txId: `0x${generateHex(8)}`,
    seedHash: generateHex(64),
    serverSeed: generateHex(64),
  };
}

function generateInitialEntries(): FeedEntry[] {
  return Array.from({ length: 20 }, (_, i) => randomEntry(i));
}

function FairnessModal({
  entry,
  onClose,
}: {
  entry: FeedEntry;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-md rounded-2xl border border-gold/20 bg-obsidian/95 p-6 shadow-[0_0_40px_rgba(255,215,0,0.1)] backdrop-blur-xl scanline-overlay"
      >
        <div className="relative z-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <h3 className="text-sm font-bold text-white">
                Provably Fair Verification
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-white/25">
                Transaction ID
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gold">{entry.txId}</span>
                <button
                  onClick={() => copyText(entry.txId, "txId")}
                  className="p-1 text-white/20 hover:text-white/50"
                >
                  {copied === "txId" ? (
                    <Check className="h-3 w-3 text-matrix" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mb-1 text-[9px] uppercase tracking-wider text-white/25">
                  Game
                </div>
                <span className="text-white/60">{entry.game}</span>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mb-1 text-[9px] uppercase tracking-wider text-white/25">
                  Result
                </div>
                <span
                  className={
                    entry.type === "jackpot"
                      ? "text-gold"
                      : entry.type === "win"
                        ? "text-matrix"
                        : "text-red-400"
                  }
                >
                  {entry.type === "bet" ? "LOSS" : entry.type.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mb-1 text-[9px] uppercase tracking-wider text-white/25">
                  Wager
                </div>
                <span className="text-white/60">{entry.amount}</span>
              </div>
              {entry.multiplier && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="mb-1 text-[9px] uppercase tracking-wider text-white/25">
                    Multiplier
                  </div>
                  <span className="text-matrix">{entry.multiplier}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-white/25">
                Server Seed Hash (SHA-256)
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-white/40">{entry.seedHash}</span>
                <button
                  onClick={() => copyText(entry.seedHash, "hash")}
                  className="shrink-0 p-1 text-white/20 hover:text-white/50"
                >
                  {copied === "hash" ? (
                    <Check className="h-3 w-3 text-matrix" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-matrix/10 bg-matrix/[0.03] p-3">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-matrix/40">
                Server Seed (Revealed)
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-matrix/60">
                  {entry.serverSeed}
                </span>
                <button
                  onClick={() => copyText(entry.serverSeed, "seed")}
                  className="shrink-0 p-1 text-white/20 hover:text-white/50"
                >
                  {copied === "seed" ? (
                    <Check className="h-3 w-3 text-matrix" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[9px] leading-relaxed text-white/15">
            Verify: SHA-256(Server Seed) should equal the Server Seed Hash.
            This proves the result was determined before your bet.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EntryLine({
  entry,
  onVerify,
}: {
  entry: FeedEntry;
  onVerify: (e: FeedEntry) => void;
}) {
  const borderClass =
    entry.type === "jackpot"
      ? "kernel-log-entry jackpot"
      : entry.type === "win"
        ? "kernel-log-entry win"
        : "kernel-log-entry loss";

  return (
    <motion.div
      initial={{ opacity: 0, x: 8, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className={`${borderClass} py-1.5`}
    >
      <div className="flex items-start gap-1.5">
        <span className="mt-px shrink-0">
          {entry.type === "jackpot" ? (
            <Flame className="h-3 w-3 text-gold" />
          ) : entry.type === "win" ? (
            <ArrowUpRight className="h-3 w-3 text-matrix" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-white/20" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-white/15">[{entry.timestamp}]</span>{" "}
          <span className="text-white/40">{entry.user}</span>{" "}
          <span className="text-white/15">
            {entry.type === "bet" ? "wagered" : "won"}
          </span>{" "}
          <span
            className={
              entry.type === "jackpot"
                ? "font-semibold text-gold"
                : entry.type === "win"
                  ? "text-matrix"
                  : "text-white/30"
            }
          >
            {entry.amount}
          </span>{" "}
          <span className="text-white/10">on</span>{" "}
          <span className="text-white/30">{entry.game}</span>
          {entry.multiplier && (
            <>
              {" "}
              <span className="text-white/10">@</span>{" "}
              <span
                className={
                  entry.type === "jackpot"
                    ? "font-bold text-gold"
                    : "text-matrix"
                }
              >
                {entry.multiplier}
              </span>
            </>
          )}
          {(entry.type === "win" || entry.type === "jackpot") && (
            <>
              {" "}
              <button
                onClick={() => onVerify(entry)}
                className="inline-flex items-center gap-0.5 rounded border border-white/[0.06] bg-white/[0.02] px-1 py-px text-[9px] text-white/25 transition-colors hover:border-gold/20 hover:text-gold/60"
              >
                <ShieldCheck className="h-2.5 w-2.5" />
                {entry.txId}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TerminalFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const idRef = useRef(20);
  const [mounted, setMounted] = useState(false);
  const [verifyEntry, setVerifyEntry] = useState<FeedEntry | null>(null);

  useEffect(() => {
    setEntries(generateInitialEntries());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      idRef.current += 1;
      const newId = idRef.current;
      setEntries((prev) => [randomEntry(newId), ...prev].slice(0, 50));
    }, 2200);
    return () => clearInterval(interval);
  }, [mounted]);

  const handleVerify = useCallback((entry: FeedEntry) => {
    setVerifyEntry(entry);
  }, []);

  return (
    <>
      <AnimatePresence>
        {verifyEntry && (
          <FairnessModal
            entry={verifyEntry}
            onClose={() => setVerifyEntry(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex h-full flex-col scanline-overlay"
      >
        {/* Header */}
        <div className="relative z-10 flex items-center gap-2 border-b border-gold/10 px-4 py-3">
          <Terminal className="h-4 w-4 text-matrix" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            sys.ledger
          </span>
          <span className="font-mono text-[9px] text-white/15">
            // kernel.log
          </span>
          <motion.span
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-auto h-1.5 w-1.5 rounded-full bg-matrix shadow-[0_0_6px_rgba(0,255,65,0.5)]"
          />
        </div>

        {/* Feed */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-2 hide-scrollbar kernel-log">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <EntryLine
                key={entry.id}
                entry={entry}
                onVerify={handleVerify}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-gold/10 px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-gold/10 bg-white/[0.02] px-3 py-1.5">
            <span className="font-mono text-xs text-matrix/60">
              root@rapid ~$
            </span>
            <input
              type="text"
              placeholder="type in chat..."
              className="flex-1 bg-transparent font-mono text-xs text-white/40 placeholder:text-white/10 outline-none"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
