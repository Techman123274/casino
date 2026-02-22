"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Bet from "@/models/Bet";
import Transaction from "@/models/Transaction";
import GameRound from "@/models/GameRound";
import mongoose from "mongoose";
import {
  createRound,
  getCurrentRound,
  startFlying,
  addBet,
  cashOut as engineCashOut,
  crashRound,
  getRoundSnapshot,
  getHistory,
  type RoundSnapshot,
} from "@/lib/game-engine/crash-loop";

/* ═══════════════════════════════════════════════
   PUBLIC SERVER ACTIONS
   ═══════════════════════════════════════════════ */

export interface ClientRoundData {
  snapshot: RoundSnapshot;
  history: number[];
}

export async function initRound(): Promise<ClientRoundData> {
  const round = createRound();
  return {
    snapshot: getRoundSnapshot(),
    history: getHistory(),
  };
}

export async function getSnapshot(): Promise<ClientRoundData> {
  return {
    snapshot: getRoundSnapshot(),
    history: getHistory(),
  };
}

export async function transitionToFlying(): Promise<RoundSnapshot> {
  startFlying();
  return getRoundSnapshot();
}

/* ── Place Bet ── */

export async function placeCrashBet(
  amount: number
): Promise<
  | { ok: true; balance: string; snapshot: RoundSnapshot }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  if (amount <= 0) return { ok: false, error: "Invalid bet" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const credits = parseFloat(user.credits.toString());
  if (credits < amount) return { ok: false, error: "Insufficient RC" };

  const round = getCurrentRound();
  const engineResult = addBet(
    session.user.id,
    user.username,
    user.avatar || "👻",
    amount
  );

  if (!engineResult.ok) return { ok: false, error: engineResult.error };

  const newCredits = credits - amount;
  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  const wagered = parseFloat(user.vault.wageredCredits.toString());
  user.vault.wageredCredits = mongoose.Types.Decimal128.fromString(
    (wagered + amount).toFixed(2)
  );
  await user.save();

  await Transaction.create({
    userId: user._id,
    amount: -amount,
    balanceBefore: credits,
    balanceAfter: newCredits,
    reason: "GAME_LOSS",
    description: `Lunar Crash wager: -${amount} RC (round #${round.id})`,
    meta: { gameId: "crash", roundId: round.id },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    balance: newCredits.toFixed(2),
    snapshot: getRoundSnapshot(),
  };
}

/* ── Cash Out ── */

export async function crashCashOut(
  currentMultiplier: number
): Promise<
  | { ok: true; payout: number; multiplier: number; balance: string; snapshot: RoundSnapshot }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const result = engineCashOut(session.user.id, currentMultiplier);
  if (!result.ok) return { ok: false, error: result.error };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const currentCredits = parseFloat(user.credits.toString());
  const newCredits = currentCredits + result.payout;
  const profit = result.payout - (currentCredits - currentCredits); // net gain

  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  if (result.payout > 0) {
    const lifetime = parseFloat(user.vault.lifetimeEarnings.toString());
    user.vault.lifetimeEarnings = mongoose.Types.Decimal128.fromString(
      (lifetime + Math.max(0, result.payout)).toFixed(2)
    );
  }
  await user.save();

  const round = getCurrentRound();

  await Transaction.create({
    userId: user._id,
    amount: result.payout,
    balanceBefore: currentCredits,
    balanceAfter: newCredits,
    reason: "GAME_WIN",
    description: `Lunar Crash cashout: +${result.payout} RC (${result.multiplier.toFixed(2)}x)`,
    meta: { gameId: "crash", roundId: round.id, multiplier: result.multiplier },
  });

  await Bet.create({
    userId: user._id,
    gameId: "crash",
    wager: result.payout / result.multiplier,
    multiplier: result.multiplier,
    payout: result.payout,
    result: "win",
    meta: { roundId: round.id, crashPoint: round.crashPoint },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    payout: result.payout,
    multiplier: result.multiplier,
    balance: newCredits.toFixed(2),
    snapshot: getRoundSnapshot(),
  };
}

/* ── Finish Round ── */

export async function finishCrashRound(): Promise<{
  serverSeed: string;
  crashPoint: number;
  snapshot: RoundSnapshot;
}> {
  const round = getCurrentRound();
  const { serverSeed, crashPoint, losers, winners } = crashRound();

  await connectDB();

  // Record losing bets
  for (const loser of losers) {
    await Bet.create({
      userId: loser.userId,
      gameId: "crash",
      wager: loser.amount,
      multiplier: 0,
      payout: 0,
      result: "loss",
      meta: { roundId: round.id, crashPoint },
    });
  }

  // Calculate totals
  let totalWagered = 0;
  let totalPayout = 0;
  for (const bet of [...winners, ...losers]) {
    totalWagered += bet.amount;
    totalPayout += bet.payout;
  }

  // Record round in game_history
  await GameRound.create({
    gameId: "crash",
    roundNonce: round.id,
    crashPoint,
    serverSeed,
    seedHash: round.seedHash,
    clientSeed: round.clientSeed,
    totalBets: winners.length + losers.length,
    totalWagered,
    totalPayout,
    playerCount: winners.length + losers.length,
  }).catch(() => {});

  return {
    serverSeed,
    crashPoint,
    snapshot: getRoundSnapshot(),
  };
}

/* ── Force new round ── */

export async function forceNewRound(): Promise<ClientRoundData> {
  return initRound();
}
