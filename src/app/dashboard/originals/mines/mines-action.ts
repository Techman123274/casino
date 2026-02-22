"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Bet from "@/models/Bet";
import Transaction from "@/models/Transaction";
import {
  generateServerSeed,
  hashSeed,
  deriveMinePositions,
  computeMultiplier,
} from "@/lib/fairness";
import mongoose from "mongoose";

interface ActiveGame {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  minesCount: number;
  betAmount: number;
  userId: string;
  minePositions: number[];
}

const activeGames = new Map<string, ActiveGame>();

export async function startMinesGame(
  betAmount: number,
  minesCount: number,
  clientSeed: string,
  nonce: number
): Promise<
  | { ok: true; seedHash: string; nonce: number; balance: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (betAmount <= 0) return { ok: false, error: "Invalid bet amount" };
  if (minesCount < 1 || minesCount > 24) return { ok: false, error: "Invalid mine count" };

  await connectDB();

  const user = await User.findById(session.user.id);
  if (!user) return { ok: false, error: "User not found" };

  const credits = parseFloat(user.credits.toString());
  if (credits < betAmount) return { ok: false, error: "Insufficient RC balance" };

  const newCredits = credits - betAmount;
  user.credits = mongoose.Types.Decimal128.fromString(newCredits.toFixed(2));

  // Track wagered in vault
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
    description: `Mines wager: -${betAmount} RC`,
    meta: { gameId: "mines", minesCount, nonce },
  });

  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);
  const minePositions = deriveMinePositions(serverSeed, clientSeed, nonce, minesCount);

  const gameKey = `${session.user.id}:${nonce}`;
  activeGames.set(gameKey, {
    serverSeed,
    clientSeed,
    nonce,
    minesCount,
    betAmount,
    userId: session.user.id,
    minePositions,
  });

  return {
    ok: true,
    seedHash,
    nonce,
    balance: newCredits.toFixed(2),
  };
}

export async function revealMinesTile(
  tileIndex: number,
  nonce: number
): Promise<
  | { ok: true; safe: true; multiplier: number }
  | { ok: true; safe: false; minePositions: number[]; serverSeed: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gameKey = `${session.user.id}:${nonce}`;
  const game = activeGames.get(gameKey);
  if (!game) return { ok: false, error: "No active game found" };

  if (tileIndex < 0 || tileIndex > 24) return { ok: false, error: "Invalid tile" };

  if (game.minePositions.includes(tileIndex)) {
    activeGames.delete(gameKey);

    await connectDB();
    await Bet.create({
      userId: game.userId,
      gameId: "mines",
      wager: game.betAmount,
      multiplier: 0,
      payout: 0,
      result: "loss",
      meta: {
        minesCount: game.minesCount,
        serverSeed: game.serverSeed,
        clientSeed: game.clientSeed,
        nonce: game.nonce,
        minePositions: game.minePositions,
      },
    });

    return {
      ok: true,
      safe: false,
      minePositions: game.minePositions,
      serverSeed: game.serverSeed,
    };
  }

  return { ok: true, safe: true, multiplier: 1 };
}

export async function cashOutMines(
  revealedTiles: number[],
  nonce: number
): Promise<
  | { ok: true; payout: number; serverSeed: string; balance: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gameKey = `${session.user.id}:${nonce}`;
  const game = activeGames.get(gameKey);
  if (!game) return { ok: false, error: "No active game found" };

  if (revealedTiles.length === 0) return { ok: false, error: "No tiles revealed" };

  for (const tile of revealedTiles) {
    if (game.minePositions.includes(tile)) {
      return { ok: false, error: "Invalid cashout: revealed tile is a mine" };
    }
  }

  const multiplier = computeMultiplier(game.minesCount, revealedTiles.length);
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
    description: `Mines cashout: +${payout} RC (${multiplier}x)`,
    meta: { gameId: "mines", multiplier, revealedTiles: revealedTiles.length },
  });

  await Bet.create({
    userId: game.userId,
    gameId: "mines",
    wager: game.betAmount,
    multiplier,
    payout,
    result: "win",
    meta: {
      minesCount: game.minesCount,
      revealedTiles,
      serverSeed: game.serverSeed,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      minePositions: game.minePositions,
    },
  });

  return {
    ok: true,
    payout,
    serverSeed: game.serverSeed,
    balance: newCredits.toFixed(2),
  };
}
