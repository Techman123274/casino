"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Bet from "@/models/Bet";
import Transaction from "@/models/Transaction";
import { generateServerSeed, hashSeed } from "@/lib/fairness";
import mongoose from "mongoose";
import crypto from "crypto";

/* ═══════════════════════════════════════════════
   TOWERS — CONFIG
   ═══════════════════════════════════════════════ */

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  tilesPerRow: number;
  trapsPerRow: number;
  multipliers: number[];
}

const DIFFICULTY_MAP: Record<Difficulty, DifficultyConfig> = {
  easy: {
    tilesPerRow: 3,
    trapsPerRow: 1,
    multipliers: [1.31, 1.72, 2.25, 2.96, 3.88, 5.09, 6.68, 8.77, 11.51, 15.11],
  },
  medium: {
    tilesPerRow: 2,
    trapsPerRow: 1,
    multipliers: [1.90, 3.61, 6.86, 13.03, 24.76, 47.04, 89.38, 169.82, 322.66, 613.06],
  },
  hard: {
    tilesPerRow: 3,
    trapsPerRow: 2,
    multipliers: [2.82, 7.96, 22.44, 63.28, 178.45, 503.15, 1418.88, 4001.24, 11283.50, 31819.47],
  },
};

const TOTAL_FLOORS = 10;

/* ═══════════════════════════════════════════════
   TRAP DERIVATION
   ═══════════════════════════════════════════════ */

function deriveTrapPositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  difficulty: Difficulty
): number[][] {
  const config = DIFFICULTY_MAP[difficulty];
  const allTraps: number[][] = [];

  for (let floor = 0; floor < TOTAL_FLOORS; floor++) {
    const hmac = crypto
      .createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}:${floor}`)
      .digest("hex");

    const traps: Set<number> = new Set();
    let cursor = 0;

    while (traps.size < config.trapsPerRow) {
      const chunk = hmac.slice(cursor, cursor + 2);
      const value = parseInt(chunk, 16) % config.tilesPerRow;

      if (!traps.has(value)) {
        traps.add(value);
      }
      cursor += 2;

      if (cursor >= hmac.length - 1 && traps.size < config.trapsPerRow) {
        const extended = crypto
          .createHmac("sha256", serverSeed)
          .update(`${clientSeed}:${nonce}:${floor}:${cursor}`)
          .digest("hex");
        cursor = 0;
        for (let i = 0; i < extended.length - 1 && traps.size < config.trapsPerRow; i += 2) {
          const v = parseInt(extended.slice(i, i + 2), 16) % config.tilesPerRow;
          traps.add(v);
        }
      }
    }

    allTraps.push(Array.from(traps));
  }

  return allTraps;
}

/* ═══════════════════════════════════════════════
   ACTIVE GAMES (in-memory)
   ═══════════════════════════════════════════════ */

interface ActiveTowersGame {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  difficulty: Difficulty;
  betAmount: number;
  userId: string;
  trapPositions: number[][];
  currentFloor: number;
}

const activeGames = new Map<string, ActiveTowersGame>();

/* ═══════════════════════════════════════════════
   START GAME
   ═══════════════════════════════════════════════ */

export async function startTowersGame(
  betAmount: number,
  difficulty: Difficulty,
  clientSeed: string,
  nonce: number
): Promise<
  | { ok: true; seedHash: string; nonce: number; balance: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (betAmount <= 0) return { ok: false, error: "Invalid bet amount" };
  if (!DIFFICULTY_MAP[difficulty]) return { ok: false, error: "Invalid difficulty" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const credits = parseFloat(user.credits.toString());
  if (credits < betAmount) return { ok: false, error: "Insufficient RC balance" };

  const newCredits = credits - betAmount;
  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  const wagered = parseFloat(user.vault.wageredCredits.toString());
  user.vault.wageredCredits = mongoose.Types.Decimal128.fromString(
    (wagered + betAmount).toFixed(2)
  );

  await user.save();

  await Transaction.create({
    userId: user._id,
    amount: -betAmount,
    balanceBefore: credits,
    balanceAfter: newCredits,
    reason: "GAME_LOSS",
    description: `Towers wager: -${betAmount} RC`,
    meta: { gameId: "towers", difficulty, nonce },
  });

  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);
  const trapPositions = deriveTrapPositions(serverSeed, clientSeed, nonce, difficulty);

  const gameKey = `${session.user.id}:towers:${nonce}`;
  activeGames.set(gameKey, {
    serverSeed,
    clientSeed,
    nonce,
    difficulty,
    betAmount,
    userId: session.user.id,
    trapPositions,
    currentFloor: 0,
  });

  return {
    ok: true,
    seedHash,
    nonce,
    balance: newCredits.toFixed(2),
  };
}

/* ═══════════════════════════════════════════════
   REVEAL TILE
   ═══════════════════════════════════════════════ */

export async function revealTowersTile(
  floor: number,
  tileIndex: number,
  nonce: number
): Promise<
  | { ok: true; safe: true; multiplier: number; floor: number }
  | { ok: true; safe: false; trapPositions: number[][]; serverSeed: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gameKey = `${session.user.id}:towers:${nonce}`;
  const game = activeGames.get(gameKey);
  if (!game) return { ok: false, error: "No active game found" };

  if (floor !== game.currentFloor) return { ok: false, error: "Invalid floor" };

  const config = DIFFICULTY_MAP[game.difficulty];
  if (tileIndex < 0 || tileIndex >= config.tilesPerRow) {
    return { ok: false, error: "Invalid tile index" };
  }

  const floorTraps = game.trapPositions[floor];

  if (floorTraps.includes(tileIndex)) {
    activeGames.delete(gameKey);

    await connectDB();
    await Bet.create({
      userId: game.userId,
      gameId: "towers",
      wager: game.betAmount,
      multiplier: 0,
      payout: 0,
      result: "loss",
      meta: {
        difficulty: game.difficulty,
        serverSeed: game.serverSeed,
        clientSeed: game.clientSeed,
        nonce: game.nonce,
        trapPositions: game.trapPositions,
        floorReached: floor,
      },
    });

    return {
      ok: true,
      safe: false,
      trapPositions: game.trapPositions,
      serverSeed: game.serverSeed,
    };
  }

  game.currentFloor = floor + 1;
  const multiplier = config.multipliers[floor];

  return { ok: true, safe: true, multiplier, floor };
}

/* ═══════════════════════════════════════════════
   CASH OUT
   ═══════════════════════════════════════════════ */

export async function cashOutTowers(
  currentFloor: number,
  nonce: number
): Promise<
  | { ok: true; payout: number; serverSeed: string; balance: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gameKey = `${session.user.id}:towers:${nonce}`;
  const game = activeGames.get(gameKey);
  if (!game) return { ok: false, error: "No active game found" };

  if (currentFloor < 1) return { ok: false, error: "Must clear at least one floor" };
  if (currentFloor !== game.currentFloor) return { ok: false, error: "Floor mismatch" };

  const config = DIFFICULTY_MAP[game.difficulty];
  const multiplier = config.multipliers[currentFloor - 1];
  const payout = Math.floor(game.betAmount * multiplier * 100) / 100;

  activeGames.delete(gameKey);

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const currentCredits = parseFloat(user.credits.toString());
  const newCredits = currentCredits + payout;
  const profit = payout - game.betAmount;

  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  const lifetime = parseFloat(user.vault.lifetimeEarnings.toString());
  if (profit > 0) {
    user.vault.lifetimeEarnings = mongoose.Types.Decimal128.fromString(
      (lifetime + profit).toFixed(2)
    );
  }

  await user.save();

  await Transaction.create({
    userId: user._id,
    amount: payout,
    balanceBefore: currentCredits,
    balanceAfter: newCredits,
    reason: "GAME_WIN",
    description: `Towers cashout: +${payout} RC (${multiplier}x)`,
    meta: { gameId: "towers", multiplier, floorsCleared: currentFloor },
  });

  await Bet.create({
    userId: game.userId,
    gameId: "towers",
    wager: game.betAmount,
    multiplier,
    payout,
    result: "win",
    meta: {
      difficulty: game.difficulty,
      floorsCleared: currentFloor,
      serverSeed: game.serverSeed,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      trapPositions: game.trapPositions,
    },
  });

  return {
    ok: true,
    payout,
    serverSeed: game.serverSeed,
    balance: newCredits.toFixed(2),
  };
}
