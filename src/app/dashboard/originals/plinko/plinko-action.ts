"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Bet from "@/models/Bet";
import Transaction from "@/models/Transaction";
import { generateServerSeed, hashSeed } from "@/lib/fairness";
import mongoose from "mongoose";
import crypto from "crypto";

type Risk = "low" | "medium" | "high";

const MULTIPLIERS: Record<number, Record<Risk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

function derivePlinkoPath(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number
): number[] {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  const path: number[] = [];
  for (let i = 0; i < rows; i++) {
    const hexChar = hmac[i % hmac.length];
    path.push(parseInt(hexChar, 16) >= 8 ? 1 : 0);
  }
  return path;
}

function pathToBucket(path: number[]): number {
  return path.reduce((sum, dir) => sum + dir, 0);
}

export async function playPlinko(
  betAmount: number,
  risk: Risk,
  rows: number
): Promise<
  | {
      ok: true;
      path: number[];
      bucket: number;
      multiplier: number;
      payout: number;
      serverSeed: string;
      seedHash: string;
      balance: string;
    }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (betAmount <= 0) return { ok: false, error: "Invalid bet amount" };
  if (![8, 12, 16].includes(rows)) return { ok: false, error: "Invalid row count" };
  if (!["low", "medium", "high"].includes(risk))
    return { ok: false, error: "Invalid risk level" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const credits = parseFloat(user.credits.toString());
  if (credits < betAmount) return { ok: false, error: "Insufficient RC balance" };

  const afterWager = credits - betAmount;
  user.credits = mongoose.Types.Decimal128.fromString(afterWager.toFixed(2));

  const wagered = parseFloat(user.vault.wageredCredits.toString());
  user.vault.wageredCredits = mongoose.Types.Decimal128.fromString(
    (wagered + betAmount).toFixed(2)
  );

  await user.save();

  await Transaction.create({
    userId: user._id,
    amount: -betAmount,
    balanceBefore: credits,
    balanceAfter: afterWager,
    reason: "GAME_LOSS",
    description: `Plinko wager: -${betAmount} RC`,
    meta: { gameId: "plinko", risk, rows },
  });

  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);
  const clientSeed = Math.random().toString(36).slice(2, 10);
  const nonce = Date.now();

  const path = derivePlinkoPath(serverSeed, clientSeed, nonce, rows);
  const bucket = pathToBucket(path);
  const multiplierTable = MULTIPLIERS[rows][risk];
  const multiplier = multiplierTable[bucket];
  const payout = Math.floor(betAmount * multiplier * 100) / 100;

  let finalBalance = afterWager;

  if (payout > 0) {
    const userRefresh = await User.findById(session.user.id);
    if (!userRefresh) return { ok: false, error: "User not found" };

    const currentCredits = parseFloat(userRefresh.credits.toString());
    finalBalance = currentCredits + payout;
    userRefresh.credits = mongoose.Types.Decimal128.fromString(finalBalance.toFixed(2));

    const profit = payout - betAmount;
    if (profit > 0) {
      const lifetime = parseFloat(userRefresh.vault.lifetimeEarnings.toString());
      userRefresh.vault.lifetimeEarnings = mongoose.Types.Decimal128.fromString(
        (lifetime + profit).toFixed(2)
      );
    }

    await userRefresh.save();

    await Transaction.create({
      userId: user._id,
      amount: payout,
      balanceBefore: currentCredits,
      balanceAfter: finalBalance,
      reason: "GAME_WIN",
      description: `Plinko win: +${payout} RC (${multiplier}x)`,
      meta: { gameId: "plinko", multiplier, bucket, risk, rows },
    });
  }

  await Bet.create({
    userId: user._id,
    gameId: "plinko",
    wager: betAmount,
    multiplier,
    payout,
    result: payout >= betAmount ? "win" : "loss",
    meta: {
      risk,
      rows,
      path,
      bucket,
      serverSeed,
      clientSeed,
      nonce,
      seedHash,
    },
  });

  return {
    ok: true,
    path,
    bucket,
    multiplier,
    payout,
    serverSeed,
    seedHash,
    balance: finalBalance.toFixed(2),
  };
}
