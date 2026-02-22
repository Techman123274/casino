"use server";

import crypto from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Bet from "@/models/Bet";
import Transaction from "@/models/Transaction";
import { generateServerSeed, hashSeed } from "@/lib/fairness";
import mongoose from "mongoose";

let globalNonce = 0;

const SYMBOL_COUNT = 6;
const ROWS = 3;
const COLS = 5;

enum Symbol {
  LEAF = 0,
  TERMINAL = 1,
  GOLD_BAR = 2,
  DAGGER = 3,
  SEVEN = 4,
  WILD = 5,
}

const PAYLINES: [number, number][][] = [
  // Line 1: middle row
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
  // Line 2: top row
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  // Line 3: bottom row
  [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
  // Line 4: V shape
  [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
  // Line 5: inverted V
  [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
  // Line 6: zigzag top-mid
  [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]],
  // Line 7: zigzag mid-bot
  [[0, 1], [1, 2], [2, 1], [3, 2], [4, 1]],
  // Line 8: zigzag bot-mid
  [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]],
  // Line 9: zigzag mid-top
  [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1]],
];

const PAYOUT_TABLE: Record<number, { three: number; four: number; five: number }> = {
  [Symbol.LEAF]:     { three: 2,  four: 5,  five: 10 },
  [Symbol.TERMINAL]: { three: 3,  four: 8,  five: 25 },
  [Symbol.GOLD_BAR]: { three: 4,  four: 12, five: 40 },
  [Symbol.DAGGER]:   { three: 5,  four: 15, five: 60 },
  [Symbol.SEVEN]:    { three: 5,  four: 20, five: 100 },
  [Symbol.WILD]:     { three: 5,  four: 20, five: 100 },
};

function deriveGrid(serverSeed: string, clientSeed: string, nonce: number): number[][] {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  const grid: number[][] = [];
  for (let col = 0; col < COLS; col++) {
    const reel: number[] = [];
    for (let row = 0; row < ROWS; row++) {
      const idx = (col * ROWS + row) * 2;
      const hexPair = hmac.slice(idx, idx + 2);
      reel.push(parseInt(hexPair, 16) % SYMBOL_COUNT);
    }
    grid.push(reel);
  }
  return grid;
}

function matchesSymbol(a: number, b: number): boolean {
  if (a === Symbol.WILD || b === Symbol.WILD) return true;
  return a === b;
}

function evaluatePaylines(
  grid: number[][],
  betPerLine: number
): { line: number; symbols: number; payout: number }[] {
  const results: { line: number; symbols: number; payout: number }[] = [];

  for (let li = 0; li < PAYLINES.length; li++) {
    const positions = PAYLINES[li];
    const lineSymbols = positions.map(([col, row]) => grid[col][row]);

    const baseSymbol =
      lineSymbols[0] === Symbol.WILD
        ? lineSymbols.find((s) => s !== Symbol.WILD) ?? Symbol.WILD
        : lineSymbols[0];

    let matchCount = 0;
    for (const sym of lineSymbols) {
      if (matchesSymbol(sym, baseSymbol)) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const payEntry = PAYOUT_TABLE[baseSymbol];
      let multiplier = 0;
      if (matchCount === 3) multiplier = payEntry.three;
      else if (matchCount === 4) multiplier = payEntry.four;
      else if (matchCount >= 5) multiplier = payEntry.five;

      results.push({
        line: li + 1,
        symbols: matchCount,
        payout: Math.floor(betPerLine * multiplier * 100) / 100,
      });
    }
  }

  return results;
}

function countScatters(grid: number[][]): number {
  let count = 0;
  for (const reel of grid) {
    for (const sym of reel) {
      if (sym === Symbol.LEAF) count++;
    }
  }
  return count;
}

export async function spinSlots(
  betAmount: number,
  clientSeed: string
): Promise<
  | {
      ok: true;
      grid: number[][];
      paylines: { line: number; symbols: number; payout: number }[];
      totalPayout: number;
      scatterCount: number;
      isScatterWin: boolean;
      serverSeed: string;
      seedHash: string;
      balance: string;
    }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (betAmount <= 0) return { ok: false, error: "Invalid bet amount" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const credits = parseFloat(user.credits.toString());
  if (credits < betAmount) return { ok: false, error: "Insufficient RC balance" };

  globalNonce++;
  const nonce = globalNonce;
  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);

  const grid = deriveGrid(serverSeed, clientSeed, nonce);

  const betPerLine = betAmount / PAYLINES.length;
  const paylines = evaluatePaylines(grid, betPerLine);

  let totalPayout = paylines.reduce((sum, p) => sum + p.payout, 0);

  const scatterCount = countScatters(grid);
  const isScatterWin = scatterCount >= 3;

  if (isScatterWin) {
    totalPayout = Math.floor(totalPayout * 3 * 100) / 100;
    if (totalPayout === 0) {
      totalPayout = Math.floor(betAmount * 3 * 100) / 100;
    }
  }

  totalPayout = Math.floor(totalPayout * 100) / 100;

  const newCredits = credits - betAmount + totalPayout;
  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  const wagered = parseFloat(user.vault.wageredCredits.toString());
  user.vault.wageredCredits = mongoose.Types.Decimal128.fromString(
    (wagered + betAmount).toFixed(2)
  );

  if (totalPayout > betAmount) {
    const profit = totalPayout - betAmount;
    const lifetime = parseFloat(user.vault.lifetimeEarnings.toString());
    user.vault.lifetimeEarnings = mongoose.Types.Decimal128.fromString(
      (lifetime + profit).toFixed(2)
    );
  }

  await user.save();

  if (totalPayout > 0) {
    await Transaction.create({
      userId: user._id,
      amount: -betAmount,
      balanceBefore: credits,
      balanceAfter: credits - betAmount,
      reason: "GAME_LOSS",
      description: `Slots wager: -${betAmount} RC`,
      meta: { gameId: "slots", nonce },
    });
    await Transaction.create({
      userId: user._id,
      amount: totalPayout,
      balanceBefore: credits - betAmount,
      balanceAfter: newCredits,
      reason: "GAME_WIN",
      description: `Slots win: +${totalPayout} RC`,
      meta: { gameId: "slots", nonce, scatterCount, isScatterWin },
    });
  } else {
    await Transaction.create({
      userId: user._id,
      amount: -betAmount,
      balanceBefore: credits,
      balanceAfter: newCredits,
      reason: "GAME_LOSS",
      description: `Slots loss: -${betAmount} RC`,
      meta: { gameId: "slots", nonce },
    });
  }

  await Bet.create({
    userId: user._id,
    gameId: "slots",
    wager: betAmount,
    multiplier: totalPayout > 0 ? Math.floor((totalPayout / betAmount) * 10000) / 10000 : 0,
    payout: totalPayout,
    result: totalPayout > 0 ? "win" : "loss",
    meta: { grid, paylines, scatterCount, isScatterWin, serverSeed, clientSeed, nonce },
  });

  return {
    ok: true,
    grid,
    paylines,
    totalPayout,
    scatterCount,
    isScatterWin,
    serverSeed,
    seedHash,
    balance: newCredits.toFixed(2),
  };
}
