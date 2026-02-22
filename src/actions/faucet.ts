"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

const DAILY_REWARD = 100;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface FaucetResult {
  ok: boolean;
  credits?: string;
  reward?: number;
  nextClaimAt?: string;
  error?: string;
}

export async function claimDailyCredits(): Promise<FaucetResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const now = Date.now();
  const lastClaimed = user.lastClaimed ? user.lastClaimed.getTime() : 0;
  const elapsed = now - lastClaimed;

  if (elapsed < COOLDOWN_MS) {
    const nextClaimAt = new Date(lastClaimed + COOLDOWN_MS).toISOString();
    return { ok: false, error: "Already claimed today", nextClaimAt };
  }

  const currentCredits = parseFloat(user.credits.toString());
  const newCredits = currentCredits + DAILY_REWARD;

  const balanceBefore = currentCredits;
  const balanceAfter = newCredits;

  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));
  user.lastClaimed = new Date(now);

  // Update vault bonus tracking
  const currentBonus = parseFloat(user.vault.bonusCredits.toString());
  user.vault.bonusCredits = mongoose.Types.Decimal128.fromString(
    (currentBonus + DAILY_REWARD).toFixed(2)
  );

  await user.save();

  await Transaction.create({
    userId: user._id,
    amount: DAILY_REWARD,
    balanceBefore,
    balanceAfter,
    reason: "DAILY_REWARD",
    description: `Daily faucet: +${DAILY_REWARD} RC`,
  });

  return {
    ok: true,
    credits: newCredits.toFixed(2),
    reward: DAILY_REWARD,
  };
}

export async function getFaucetStatus(): Promise<{
  canClaim: boolean;
  nextClaimAt: string | null;
  credits: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { canClaim: false, nextClaimAt: null, credits: "0.00" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { canClaim: false, nextClaimAt: null, credits: "0.00" };

  const now = Date.now();
  const lastClaimed = user.lastClaimed ? user.lastClaimed.getTime() : 0;
  const elapsed = now - lastClaimed;
  const canClaim = elapsed >= COOLDOWN_MS;
  const nextClaimAt = canClaim ? null : new Date(lastClaimed + COOLDOWN_MS).toISOString();

  return {
    canClaim,
    nextClaimAt,
    credits: parseFloat(user.credits.toString()).toFixed(2),
  };
}
