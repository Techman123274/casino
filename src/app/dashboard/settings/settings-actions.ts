"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Bet from "@/models/Bet";

/* ─── Serialized types for client transport ─── */

export interface SettingsData {
  username: string;
  email: string;
  avatar: string;
  joinedAt: string;
  credits: string;
  vipLevel: number;
  xpProgress: number;
  twoFactorEnabled: boolean;
  passkeyEnabled: boolean;
  lastLoginIp: string;
  lastLoginAt: string;
  lastLoginDevice: string;
  isSelfExcluded: boolean;
  selfExcludeUntil: string | null;
  depositLimits: { daily: string; weekly: string; monthly: string };
  sessionTimeout: string;
  vault: {
    wageredCredits: string;
    lifetimeEarnings: string;
    bonusCredits: string;
  };
  stats: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    biggestWin: number;
    favoriteGame: string;
    netProfit: number;
  };
  recentTransactions: {
    type: string;
    amount: number;
    reason: string;
    description: string;
    time: string;
  }[];
}

export async function getSettingsData(): Promise<
  | { ok: true; data: SettingsData }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();

  const user = await User.findById(session.user.id).lean();
  if (!user) return { ok: false, error: "User not found" };

  const [recentTxs, betStats] = await Promise.all([
    Transaction.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),
    Bet.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ["$result", "loss"] }, 1, 0] } },
          biggestWin: { $max: "$payout" },
          totalWagered: { $sum: "$wager" },
          totalPayout: { $sum: "$payout" },
        },
      },
    ]),
  ]);

  const favoriteGameAgg = await Bet.aggregate([
    { $match: { userId: user._id } },
    { $group: { _id: "$gameId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  const stats = betStats[0] || {
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    biggestWin: 0,
    totalWagered: 0,
    totalPayout: 0,
  };

  const d128 = (v: any) => (v ? v.toString() : "0.00");

  const now = new Date();

  return {
    ok: true,
    data: {
      username: user.username,
      email: user.email,
      avatar: user.avatar || "👻",
      joinedAt: (user.createdAt as Date)?.toISOString?.() || now.toISOString(),
      credits: d128(user.credits),
      vipLevel: user.vipLevel || 0,
      xpProgress: user.xpProgress || 0,
      twoFactorEnabled: user.twoFactorEnabled || false,
      passkeyEnabled: user.passkeyEnabled || false,
      lastLoginIp: user.lastLoginIp || "Unknown",
      lastLoginAt: user.lastLoginAt
        ? new Date(user.lastLoginAt).toISOString()
        : now.toISOString(),
      lastLoginDevice: user.lastLoginDevice || "Unknown device",
      isSelfExcluded: user.isSelfExcluded || false,
      selfExcludeUntil: user.selfExcludeUntil
        ? new Date(user.selfExcludeUntil).toISOString()
        : null,
      depositLimits: {
        daily: user.depositLimits?.daily || "None",
        weekly: user.depositLimits?.weekly || "None",
        monthly: user.depositLimits?.monthly || "None",
      },
      sessionTimeout: user.sessionTimeout || "None",
      vault: {
        wageredCredits: d128(user.vault?.wageredCredits),
        lifetimeEarnings: d128(user.vault?.lifetimeEarnings),
        bonusCredits: d128(user.vault?.bonusCredits),
      },
      stats: {
        totalBets: stats.totalBets,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        biggestWin: stats.biggestWin || 0,
        favoriteGame: favoriteGameAgg[0]?._id || "None",
        netProfit: (stats.totalPayout || 0) - (stats.totalWagered || 0),
      },
      recentTransactions: recentTxs.map((tx: any) => {
        const elapsed = now.getTime() - new Date(tx.timestamp).getTime();
        let timeStr: string;
        if (elapsed < 60_000) timeStr = "Just now";
        else if (elapsed < 3_600_000) timeStr = `${Math.floor(elapsed / 60_000)} min ago`;
        else if (elapsed < 86_400_000) timeStr = `${Math.floor(elapsed / 3_600_000)} hr ago`;
        else timeStr = `${Math.floor(elapsed / 86_400_000)}d ago`;

        return {
          type: tx.reason,
          amount: tx.amount,
          reason: tx.reason,
          description: tx.description || "",
          time: timeStr,
        };
      }),
    },
  };
}

export async function updateProfile(
  username: string,
  avatar: string
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (!username || username.length < 3 || username.length > 20) {
    return { ok: false, error: "Username must be 3-20 characters" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { ok: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  await connectDB();

  const existing = await User.findOne({
    username: { $regex: new RegExp(`^${username}$`, "i") },
    _id: { $ne: session.user.id },
  });

  if (existing) {
    return { ok: false, error: "Username already taken" };
  }

  await User.findByIdAndUpdate(session.user.id, { username, avatar });

  console.log(
    `\x1b[32m[RAPID ROLE :: SETTINGS]\x1b[0m Profile updated: ${username} / ${avatar}`
  );

  return { ok: true, username };
}

export async function toggleTwoFactor(
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { twoFactorEnabled: enabled });

  console.log(
    `\x1b[33m[RAPID ROLE :: SETTINGS]\x1b[0m 2FA ${enabled ? "enabled" : "disabled"}`
  );

  return { ok: true };
}

export async function togglePasskey(
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { passkeyEnabled: enabled });

  return { ok: true };
}

export async function updateDepositLimits(
  daily: string,
  weekly: string,
  monthly: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    depositLimits: { daily, weekly, monthly },
  });

  console.log(
    `\x1b[33m[RAPID ROLE :: SETTINGS]\x1b[0m Limits updated: D=${daily} W=${weekly} M=${monthly}`
  );

  return { ok: true };
}

export async function updateSessionTimeout(
  timeout: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { sessionTimeout: timeout });

  return { ok: true };
}

export async function activateSelfExclusion(
  period: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await connectDB();

  let until: Date | null = null;
  const now = new Date();

  switch (period) {
    case "24 Hours":
      until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "7 Days":
      until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "30 Days":
      until = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    case "6 Months":
      until = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      break;
    case "Permanent":
      until = new Date("2099-12-31");
      break;
    default:
      return { ok: false, error: "Invalid period" };
  }

  await User.findByIdAndUpdate(session.user.id, {
    isSelfExcluded: true,
    selfExcludeUntil: until,
  });

  console.log(
    `\x1b[31m[RAPID ROLE :: SETTINGS]\x1b[0m Self-exclusion activated: ${period}`
  );

  return { ok: true };
}
