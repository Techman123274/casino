"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

/* ────────────────── Redeem Promo Code ────────────────── */

export interface RedeemResult {
  ok: boolean;
  credits?: string;
  reward?: number;
  error?: string;
}

export async function redeemPromoCode(code: string): Promise<RedeemResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (!code || code.trim().length === 0) {
    return { ok: false, error: "Please enter a promo code" };
  }

  await connectDB();

  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true,
  });

  if (!coupon) {
    return { ok: false, error: "Invalid or expired promo code" };
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This promo code has expired" };
  }

  if (coupon.currentUses >= coupon.maxUses) {
    return { ok: false, error: "This promo code has reached its usage limit" };
  }

  const userId = new mongoose.Types.ObjectId(session.user!.id);
  if (coupon.usedBy.some((id) => id.toString() === session.user!.id)) {
    return { ok: false, error: "You have already redeemed this code" };
  }

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const currentCredits = parseFloat(user.credits.toString());
  const newCredits = currentCredits + coupon.reward;

  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  const currentBonus = parseFloat(user.vault.bonusCredits.toString());
  user.vault.bonusCredits = mongoose.Types.Decimal128.fromString(
    (currentBonus + coupon.reward).toFixed(2)
  );

  await user.save();

  coupon.currentUses += 1;
  coupon.usedBy.push(userId);
  await coupon.save();

  await Transaction.create({
    userId: user._id,
    amount: coupon.reward,
    balanceBefore: currentCredits,
    balanceAfter: newCredits,
    reason: "BONUS",
    description: `Promo code redeemed: ${coupon.code} (+${coupon.reward} RC)`,
    meta: { couponCode: coupon.code, couponId: coupon._id },
  });

  return {
    ok: true,
    credits: newCredits.toFixed(2),
    reward: coupon.reward,
  };
}
