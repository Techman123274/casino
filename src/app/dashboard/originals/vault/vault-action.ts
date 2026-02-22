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
   HACK-THE-VAULT — CONFIG
   ═══════════════════════════════════════════════ */

const NODES_PER_FLOOR = 3;
const TOTAL_FLOORS = 8;

const MULTIPLIERS = [1.45, 2.18, 3.27, 4.90, 7.35, 11.02, 16.54, 24.81];

/* ═══════════════════════════════════════════════
   TRAP DERIVATION
   ═══════════════════════════════════════════════ */

function deriveFirewallPositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number[] {
  const traps: number[] = [];

  for (let floor = 0; floor < TOTAL_FLOORS; floor++) {
    const hmac = crypto
      .createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}:${floor}`)
      .digest("hex");

    const hex = hmac.slice(0, 2);
    const trapPos = parseInt(hex, 16) % NODES_PER_FLOOR;
    traps.push(trapPos);
  }

  return traps;
}

/* ═══════════════════════════════════════════════
   ACTIVE GAMES (in-memory)
   ═══════════════════════════════════════════════ */

interface ActiveVaultGame {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  betAmount: number;
  userId: string;
  firewallPositions: number[];
  currentFloor: number;
}

const activeGames = new Map<string, ActiveVaultGame>();

/* ═══════════════════════════════════════════════
   START VAULT HACK
   ═══════════════════════════════════════════════ */

export async function startVaultHack(
  betAmount: number,
  clientSeed: string,
  nonce: number
): Promise<
  | { ok: true; seedHash: string; nonce: number; balance: string }
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
    description: `Vault Hack wager: -${betAmount} RC`,
    meta: { gameId: "vault", nonce },
  });

  const serverSeed = generateServerSeed();
  const seedHash = hashSeed(serverSeed);
  const firewallPositions = deriveFirewallPositions(serverSeed, clientSeed, nonce);

  const gameKey = `${session.user.id}:vault:${nonce}`;
  activeGames.set(gameKey, {
    serverSeed,
    clientSeed,
    nonce,
    betAmount,
    userId: session.user.id,
    firewallPositions,
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
   HACK NODE
   ═══════════════════════════════════════════════ */

export async function hackNode(
  floor: number,
  nodeIndex: number,
  nonce: number
): Promise<
  | { ok: true; safe: true; multiplier: number; floor: number }
  | { ok: true; safe: false; trapPositions: number[]; serverSeed: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gameKey = `${session.user.id}:vault:${nonce}`;
  const game = activeGames.get(gameKey);
  if (!game) return { ok: false, error: "No active game found" };

  if (floor !== game.currentFloor) return { ok: false, error: "Invalid floor" };

  if (nodeIndex < 0 || nodeIndex >= NODES_PER_FLOOR) {
    return { ok: false, error: "Invalid node index" };
  }

  const firewallPos = game.firewallPositions[floor];

  if (nodeIndex === firewallPos) {
    activeGames.delete(gameKey);

    await connectDB();
    await Bet.create({
      userId: game.userId,
      gameId: "vault",
      wager: game.betAmount,
      multiplier: 0,
      payout: 0,
      result: "loss",
      meta: {
        serverSeed: game.serverSeed,
        clientSeed: game.clientSeed,
        nonce: game.nonce,
        trapPositions: game.firewallPositions,
        floorReached: floor,
      },
    });

    return {
      ok: true,
      safe: false,
      trapPositions: game.firewallPositions,
      serverSeed: game.serverSeed,
    };
  }

  game.currentFloor = floor + 1;
  const multiplier = MULTIPLIERS[floor];

  return { ok: true, safe: true, multiplier, floor };
}

/* ═══════════════════════════════════════════════
   EXTRACT LOOT
   ═══════════════════════════════════════════════ */

export async function extractLoot(
  currentFloor: number,
  nonce: number
): Promise<
  | { ok: true; payout: number; serverSeed: string; balance: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gameKey = `${session.user.id}:vault:${nonce}`;
  const game = activeGames.get(gameKey);
  if (!game) return { ok: false, error: "No active game found" };

  if (currentFloor < 1) return { ok: false, error: "Must clear at least one floor" };
  if (currentFloor !== game.currentFloor) return { ok: false, error: "Floor mismatch" };

  const multiplier = MULTIPLIERS[currentFloor - 1];
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
    description: `Vault Hack extract: +${payout} RC (${multiplier}x)`,
    meta: { gameId: "vault", multiplier, floorsCleared: currentFloor },
  });

  await Bet.create({
    userId: game.userId,
    gameId: "vault",
    wager: game.betAmount,
    multiplier,
    payout,
    result: "win",
    meta: {
      floorsCleared: currentFloor,
      serverSeed: game.serverSeed,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      trapPositions: game.firewallPositions,
    },
  });

  return {
    ok: true,
    payout,
    serverSeed: game.serverSeed,
    balance: newCredits.toFixed(2),
  };
}
