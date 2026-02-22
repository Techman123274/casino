"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

const TEST_DEPOSIT_MIN = 10;
const TEST_DEPOSIT_MAX = 100_000;

export interface DepositResult {
  ok: boolean;
  credits?: string;
  deposited?: number;
  error?: string;
}

export async function testDeposit(amount: number): Promise<DepositResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (!amount || amount < TEST_DEPOSIT_MIN || amount > TEST_DEPOSIT_MAX) {
    return {
      ok: false,
      error: `Amount must be between ${TEST_DEPOSIT_MIN} and ${TEST_DEPOSIT_MAX.toLocaleString()} RC`,
    };
  }

  const rounded = Math.round(amount * 100) / 100;

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const currentCredits = parseFloat(user.credits.toString());
  const newCredits = currentCredits + rounded;

  const balanceBefore = currentCredits;
  const balanceAfter = newCredits;

  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));
  await user.save();

  await Transaction.create({
    userId: user._id,
    amount: rounded,
    balanceBefore,
    balanceAfter,
    reason: "DEPOSIT",
    description: `Test deposit: +${rounded.toLocaleString()} RC`,
    meta: { testMode: true },
  });

  console.log(
    `\x1b[32m[RAPID ROLE :: DEPOSIT]\x1b[0m ${user.username} deposited ${rounded} RC | New balance: ${newCredits.toFixed(2)} RC`
  );

  return {
    ok: true,
    credits: newCredits.toFixed(2),
    deposited: rounded,
  };
}
