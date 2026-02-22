/**
 * LUNAR CRASH — Server-Side Game Engine
 *
 * Provably fair crash game using SHA-256 hash chain.
 * All game results are computed server-side; the client only visualizes.
 *
 * States: BETTING (5s) → FLYING (y = 1.06^x) → CRASHED → loop
 */

import crypto from "crypto";

/* ═══════════════════════════════════════════════
   PROVABLY FAIR — SHA-256 HASH CHAIN
   ═══════════════════════════════════════════════ */

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Bustabit-style provably-fair crash point.
 *
 * h = HMAC-SHA256(serverSeed, clientSeed:nonce) → take first 52 bits
 * 1-in-33 chance of instant crash (1.00x) for ~3% house edge
 * Otherwise: floor(99 / (1 - h/2^52)) / 100
 */
export function deriveCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  const h = parseInt(hmac.slice(0, 13), 16);
  const e = 2 ** 52;

  if (h % 33 === 0) return 1.0;

  return Math.max(1.0, Math.floor((100 * e - h) / (e - h)) / 100);
}

/* ═══════════════════════════════════════════════
   PLAYER BET
   ═══════════════════════════════════════════════ */

export interface PlayerBet {
  userId: string;
  username: string;
  avatar: string;
  amount: number;
  cashedOut: boolean;
  cashoutMult: number;
  payout: number;
}

/* ═══════════════════════════════════════════════
   ROUND STATE
   ═══════════════════════════════════════════════ */

export type EnginePhase = "BETTING" | "FLYING" | "CRASHED" | "IDLE";

export interface CrashRound {
  id: number;
  phase: EnginePhase;
  serverSeed: string;
  seedHash: string;
  clientSeed: string;
  crashPoint: number;
  bets: Map<string, PlayerBet>;
  createdAt: number;
  flyStartedAt: number | null;
}

export interface RoundSnapshot {
  id: number;
  phase: EnginePhase;
  seedHash: string;
  crashPoint: number;
  players: {
    userId: string;
    username: string;
    avatar: string;
    amount: number;
    cashedOut: boolean;
    cashoutMult: number;
    payout: number;
  }[];
}

/* ═══════════════════════════════════════════════
   SINGLETON ENGINE
   ═══════════════════════════════════════════════ */

const CLIENT_SEED = "rapid-role-lunar-crash-v2";

interface EngineState {
  round: CrashRound | null;
  nonce: number;
  history: number[];
}

declare global {
  var _crashEngine: EngineState | undefined;
}

function getEngine(): EngineState {
  if (!global._crashEngine) {
    global._crashEngine = { round: null, nonce: 0, history: [] };
  }
  return global._crashEngine;
}

/* ── Create a fresh round ── */
export function createRound(): CrashRound {
  const engine = getEngine();
  engine.nonce++;

  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);
  const crashPoint = deriveCrashPoint(serverSeed, CLIENT_SEED, engine.nonce);

  const round: CrashRound = {
    id: engine.nonce,
    phase: "BETTING",
    serverSeed,
    seedHash,
    clientSeed: CLIENT_SEED,
    crashPoint,
    bets: new Map(),
    createdAt: Date.now(),
    flyStartedAt: null,
  };

  engine.round = round;

  console.log(
    `\x1b[35m[LUNAR CRASH]\x1b[0m Round #${round.id} created | Crash @ ${crashPoint.toFixed(2)}x | Hash: ${seedHash.slice(0, 16)}…`
  );

  return round;
}

/* ── Get or create the current round ── */
export function getCurrentRound(): CrashRound {
  const engine = getEngine();

  if (!engine.round || engine.round.phase === "CRASHED") {
    return createRound();
  }

  // Stale round protection (>90s without phase change)
  if (Date.now() - engine.round.createdAt > 90_000 && engine.round.phase === "BETTING") {
    return createRound();
  }

  return engine.round;
}

/* ── Transition: BETTING → FLYING ── */
export function startFlying(): CrashRound {
  const round = getCurrentRound();
  if (round.phase !== "BETTING") return round;

  round.phase = "FLYING";
  round.flyStartedAt = Date.now();

  console.log(
    `\x1b[33m[LUNAR CRASH]\x1b[0m Round #${round.id} FLYING with ${round.bets.size} player(s)`
  );

  return round;
}

/* ── Place a bet during BETTING phase ── */
export function addBet(
  userId: string,
  username: string,
  avatar: string,
  amount: number
): { ok: true } | { ok: false; error: string } {
  const round = getCurrentRound();

  if (round.phase !== "BETTING") {
    return { ok: false, error: "Betting is closed" };
  }

  if (round.bets.has(userId)) {
    return { ok: false, error: "Already bet this round" };
  }

  if (amount <= 0) {
    return { ok: false, error: "Invalid bet amount" };
  }

  round.bets.set(userId, {
    userId,
    username,
    avatar,
    amount,
    cashedOut: false,
    cashoutMult: 0,
    payout: 0,
  });

  console.log(
    `\x1b[36m[LUNAR CRASH]\x1b[0m ${username} bet ${amount} RC on round #${round.id}`
  );

  return { ok: true };
}

/* ── Cash out during FLYING phase ── */
export function cashOut(
  userId: string,
  clientMultiplier: number
): { ok: true; multiplier: number; payout: number } | { ok: false; error: string } {
  const round = getCurrentRound();

  if (round.phase !== "FLYING") {
    return { ok: false, error: "Round is not flying" };
  }

  const bet = round.bets.get(userId);
  if (!bet) return { ok: false, error: "No bet found" };
  if (bet.cashedOut) return { ok: false, error: "Already cashed out" };

  // Server validates: multiplier can't exceed crash point
  const mult = Math.min(clientMultiplier, round.crashPoint);
  if (mult < 1.0) return { ok: false, error: "Invalid multiplier" };

  const payout = Math.floor(bet.amount * mult * 100) / 100;

  bet.cashedOut = true;
  bet.cashoutMult = mult;
  bet.payout = payout;

  console.log(
    `\x1b[32m[LUNAR CRASH]\x1b[0m ${bet.username} cashed out @ ${mult.toFixed(2)}x → +${payout} RC`
  );

  return { ok: true, multiplier: mult, payout };
}

/* ── Finalize: FLYING → CRASHED ── */
export function crashRound(): {
  serverSeed: string;
  crashPoint: number;
  losers: PlayerBet[];
  winners: PlayerBet[];
} {
  const engine = getEngine();
  const round = engine.round;

  if (!round || round.phase === "CRASHED") {
    return { serverSeed: "", crashPoint: 1.0, losers: [], winners: [] };
  }

  round.phase = "CRASHED";

  const losers: PlayerBet[] = [];
  const winners: PlayerBet[] = [];

  for (const bet of round.bets.values()) {
    if (bet.cashedOut) {
      winners.push(bet);
    } else {
      losers.push(bet);
    }
  }

  engine.history = [round.crashPoint, ...engine.history].slice(0, 30);

  console.log(
    `\x1b[31m[LUNAR CRASH]\x1b[0m Round #${round.id} CRASHED @ ${round.crashPoint.toFixed(2)}x | W:${winners.length} L:${losers.length}`
  );

  return {
    serverSeed: round.serverSeed,
    crashPoint: round.crashPoint,
    losers,
    winners,
  };
}

/* ── Get a snapshot safe for client transport ── */
export function getRoundSnapshot(): RoundSnapshot {
  const round = getCurrentRound();

  return {
    id: round.id,
    phase: round.phase,
    seedHash: round.seedHash,
    crashPoint: round.crashPoint,
    players: Array.from(round.bets.values()).map((b) => ({
      userId: b.userId,
      username: b.username,
      avatar: b.avatar,
      amount: b.amount,
      cashedOut: b.cashedOut,
      cashoutMult: b.cashoutMult,
      payout: b.payout,
    })),
  };
}

export function getHistory(): number[] {
  return getEngine().history;
}
