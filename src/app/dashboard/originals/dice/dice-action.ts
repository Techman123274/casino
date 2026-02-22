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

function deriveRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");
  const h = parseInt(hmac.slice(0, 8), 16);
  return (h % 10000) / 100; // 0.00 – 99.99
}

function computeDiceMultiplier(
  target: number,
  isOver: boolean,
  houseEdge = 0.01
): number {
  const winProb = isOver ? (99.99 - target) / 100 : target / 100;
  if (winProb <= 0) return 0;
  return Math.floor(((1 - houseEdge) / winProb) * 10000) / 10000;
}

export async function rollDice(
  betAmount: number,
  target: number,
  isOver: boolean,
  clientSeed: string
): Promise<
  | {
      ok: true;
      roll: number;
      won: boolean;
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
  if (target < 1 || target > 98) return { ok: false, error: "Target must be 1–98" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const credits = parseFloat(user.credits.toString());
  if (credits < betAmount) return { ok: false, error: "Insufficient RC balance" };

  globalNonce++;
  const nonce = globalNonce;
  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);
  const roll = deriveRoll(serverSeed, clientSeed, nonce);
  const multiplier = computeDiceMultiplier(target, isOver);
  const won = isOver ? roll > target : roll < target;
  const payout = won ? Math.floor(betAmount * multiplier * 100) / 100 : 0;

  const newCredits = credits - betAmount + payout;
  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  const wagered = parseFloat(user.vault.wageredCredits.toString());
  user.vault.wageredCredits = mongoose.Types.Decimal128.fromString(
    (wagered + betAmount).toFixed(2)
  );

  if (won) {
    const profit = payout - betAmount;
    if (profit > 0) {
      const lifetime = parseFloat(user.vault.lifetimeEarnings.toString());
      user.vault.lifetimeEarnings = mongoose.Types.Decimal128.fromString(
        (lifetime + profit).toFixed(2)
      );
    }
  }

  await user.save();

  if (won) {
    await Transaction.create({
      userId: user._id,
      amount: -betAmount,
      balanceBefore: credits,
      balanceAfter: credits - betAmount,
      reason: "GAME_LOSS",
      description: `Dice wager: -${betAmount} RC`,
      meta: { gameId: "dice", nonce },
    });
    await Transaction.create({
      userId: user._id,
      amount: payout,
      balanceBefore: credits - betAmount,
      balanceAfter: newCredits,
      reason: "GAME_WIN",
      description: `Dice win: +${payout} RC (${multiplier}x)`,
      meta: { gameId: "dice", nonce, roll, target, isOver },
    });
  } else {
    await Transaction.create({
      userId: user._id,
      amount: -betAmount,
      balanceBefore: credits,
      balanceAfter: newCredits,
      reason: "GAME_LOSS",
      description: `Dice loss: -${betAmount} RC`,
      meta: { gameId: "dice", nonce, roll, target, isOver },
    });
  }

  await Bet.create({
    userId: user._id,
    gameId: "dice",
    wager: betAmount,
    multiplier: won ? multiplier : 0,
    payout,
    result: won ? "win" : "loss",
    meta: { roll, target, isOver, serverSeed, clientSeed, nonce },
  });

  return {
    ok: true,
    roll,
    won,
    multiplier,
    payout,
    serverSeed,
    seedHash,
    balance: newCredits.toFixed(2),
  };
}
