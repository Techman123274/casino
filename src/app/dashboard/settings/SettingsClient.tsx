"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/GlassPanel";
import {
  User,
  Mail,
  Camera,
  Shield,
  Fingerprint,
  Smartphone,
  Clock,
  Ban,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Check,
  ChevronRight,
  AlertTriangle,
  CircleDollarSign,
  Trophy,
  TrendingUp,
  TrendingDown,
  Gamepad2,
  Zap,
  Globe,
  Monitor,
  CalendarDays,
  Loader2,
  X,
} from "lucide-react";
import {
  type SettingsData,
  updateProfile,
  toggleTwoFactor,
  togglePasskey,
  updateDepositLimits,
  updateSessionTimeout,
  activateSelfExclusion,
} from "./settings-actions";

/* ─── Section header ─── */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <Icon className="h-4 w-4 text-gold/60" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        <p className="text-[11px] text-white/25">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Obsidian input ─── */
function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-white/20">
        {label}
      </label>
      <div
        className={`relative rounded-xl border bg-white/[0.02] transition-all duration-300 ${
          error
            ? "border-red-500/30"
            : focused
            ? "border-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.05)]"
            : "border-white/[0.06] hover:border-white/[0.1]"
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent px-4 py-3 text-sm text-white/70 placeholder:text-white/15 outline-none disabled:opacity-40"
        />
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${
            error ? "via-red-500" : "via-gold"
          } to-transparent`}
          initial={false}
          animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "center" }}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-[10px] text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/* ─── Toggle switch ─── */
function ToggleSwitch({
  enabled,
  onChange,
  color = "gold",
  loading,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  color?: "gold" | "matrix";
  loading?: boolean;
}) {
  const bg = enabled
    ? color === "gold"
      ? "bg-gold/30"
      : "bg-matrix/30"
    : "bg-white/[0.06]";
  const dot = enabled
    ? color === "gold"
      ? "bg-gold"
      : "bg-matrix"
    : "bg-white/20";

  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 disabled:opacity-40 ${bg}`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`h-4 w-4 rounded-full transition-colors duration-300 ${dot}`}
      />
    </button>
  );
}

/* ─── Settings row ─── */
function SettingsRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: typeof User;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-3 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-white/20" />
        <div>
          <p className="text-sm text-white/60">{label}</p>
          {description && (
            <p className="text-[10px] text-white/20">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ─── Limit selector ─── */
function LimitSelector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-white/20">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
              value === opt
                ? "border border-gold/20 bg-gold/10 text-gold"
                : "border border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-white/60",
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-white/15" />
        <span className="text-[10px] uppercase tracking-wider text-white/20">
          {label}
        </span>
      </div>
      <p className={`font-mono text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ─── TX icon mapping ─── */
function txIcon(reason: string) {
  if (reason === "GAME_WIN" || reason === "BONUS" || reason === "DAILY_REWARD" || reason === "REFERRAL")
    return ArrowDownToLine;
  return ArrowUpFromLine;
}

function txColor(reason: string) {
  switch (reason) {
    case "GAME_WIN":
      return "text-gold";
    case "GAME_LOSS":
      return "text-white/30";
    case "DEPOSIT":
    case "DAILY_REWARD":
    case "BONUS":
    case "REFERRAL":
      return "text-matrix";
    case "WITHDRAWAL":
      return "text-red-400";
    default:
      return "text-white/40";
  }
}

/* ═════════ MAIN SETTINGS CLIENT ═════════ */

export function SettingsClient({ data }: { data: SettingsData }) {
  const [isPending, startTransition] = useTransition();

  // Account
  const [username, setUsername] = useState(data.username);
  const [avatar, setAvatar] = useState(data.avatar);
  const [usernameError, setUsernameError] = useState("");

  // Security
  const [twoFa, setTwoFa] = useState(data.twoFactorEnabled);
  const [passkey, setPasskey] = useState(data.passkeyEnabled);

  // Responsible Gaming
  const [dailyLimit, setDailyLimit] = useState(data.depositLimits.daily);
  const [weeklyLimit, setWeeklyLimit] = useState(data.depositLimits.weekly);
  const [monthlyLimit, setMonthlyLimit] = useState(data.depositLimits.monthly);
  const [sessionTimeout, setSessionTimeout] = useState(data.sessionTimeout);
  const [selfExcludeOpen, setSelfExcludeOpen] = useState(false);
  const [excludePending, setExcludePending] = useState(false);

  // Wallet
  const [phantomLinked, setPhantomLinked] = useState(false);
  const [metamaskLinked, setMetamaskLinked] = useState(false);

  // UI
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const joinDate = new Date(data.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lastLogin = new Date(data.lastLoginAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  /* ── Save profile ── */
  const handleSave = () => {
    setUsernameError("");
    setSaveError("");

    startTransition(async () => {
      const profileRes = await updateProfile(username, avatar);
      if (!profileRes.ok) {
        setUsernameError(profileRes.error);
        return;
      }

      await updateDepositLimits(dailyLimit, weeklyLimit, monthlyLimit);
      await updateSessionTimeout(sessionTimeout);

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  /* ── Toggle 2FA ── */
  const handleToggle2FA = (enabled: boolean) => {
    setTwoFa(enabled);
    startTransition(async () => {
      const res = await toggleTwoFactor(enabled);
      if (!res.ok) setTwoFa(!enabled);
    });
  };

  /* ── Toggle Passkey ── */
  const handleTogglePasskey = (enabled: boolean) => {
    setPasskey(enabled);
    startTransition(async () => {
      const res = await togglePasskey(enabled);
      if (!res.ok) setPasskey(!enabled);
    });
  };

  /* ── Self-exclude ── */
  const handleSelfExclude = (period: string) => {
    if (!confirm(`Are you sure? Self-exclusion for ${period} cannot be reversed.`)) return;
    setExcludePending(true);
    startTransition(async () => {
      await activateSelfExclusion(period);
      setExcludePending(false);
      setSelfExcludeOpen(false);
    });
  };

  const AVATARS = ["👻", "🐺", "🦊", "🎭", "💀", "🤖", "🔮", "⚡", "🎲", "🃏"];

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/30">
          Manage your identity, security, and preferences.
        </p>
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* ──── ACCOUNT ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <GlassPanel glow="gold" className="p-6">
            <SectionHeader
              icon={User}
              title="Account"
              subtitle="Your public identity and contact info"
            />

            <div className="flex flex-col gap-4">
              <SettingsInput
                label="Username"
                value={username}
                onChange={(v) => {
                  setUsername(v);
                  setUsernameError("");
                }}
                placeholder="your_username"
                error={usernameError}
              />
              <SettingsInput
                label="Email"
                value={data.email}
                onChange={() => {}}
                placeholder="you@arena.gg"
                type="email"
                disabled
              />

              {/* Joined date */}
              <div className="flex items-center gap-2 text-[11px] text-white/20">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  Member since <span className="text-white/40">{joinDate}</span>
                </span>
              </div>

              {/* Avatar */}
              <div>
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-white/20">
                  Avatar
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-2xl">
                    {avatar}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setAvatar(av)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all ${
                          avatar === av
                            ? "border-gold/30 bg-gold/[0.08] shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                            : "border-white/[0.04] bg-white/[0.02] hover:border-gold/20 hover:bg-gold/[0.06]"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ──── LIFETIME STATS ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <GlassPanel glow="gold" className="p-6">
            <SectionHeader
              icon={TrendingUp}
              title="Lifetime Statistics"
              subtitle="Your economic performance across all games"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                icon={Zap}
                label="Total Bets"
                value={data.stats.totalBets.toLocaleString()}
              />
              <StatCard
                icon={Trophy}
                label="Wins / Losses"
                value={`${data.stats.totalWins} / ${data.stats.totalLosses}`}
                color="text-matrix"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Wagered"
                value={`${parseFloat(data.vault.wageredCredits).toLocaleString("en-US", { minimumFractionDigits: 2 })} RC`}
                color="text-gold"
              />
              <StatCard
                icon={TrendingDown}
                label="Net Profit"
                value={`${data.stats.netProfit >= 0 ? "+" : ""}${data.stats.netProfit.toFixed(2)} RC`}
                color={data.stats.netProfit >= 0 ? "text-matrix" : "text-red-400"}
              />
              <StatCard
                icon={Trophy}
                label="Biggest Win"
                value={`${data.stats.biggestWin.toFixed(2)} RC`}
                color="text-gold"
              />
              <StatCard
                icon={Gamepad2}
                label="Favorite Game"
                value={data.stats.favoriteGame === "None" ? "—" : data.stats.favoriteGame}
              />
            </div>

            {/* VIP Progress */}
            <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-white/20">
                  VIP Level
                </span>
                <span className="font-mono text-sm font-bold text-gold">
                  LVL {data.vipLevel}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, data.xpProgress)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-white/15">
                {data.xpProgress}% to next level
              </p>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ──── SECURITY ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassPanel glow="gold" className="p-6">
            <SectionHeader
              icon={Shield}
              title="Security"
              subtitle="Protect your account with advanced auth"
            />

            <div className="flex flex-col gap-3">
              <SettingsRow
                icon={Smartphone}
                label="Two-Factor Authentication"
                description={twoFa ? "Active — codes required on login" : "Require a 6-digit code on every login"}
              >
                <ToggleSwitch
                  enabled={twoFa}
                  onChange={handleToggle2FA}
                  loading={isPending}
                />
              </SettingsRow>

              <SettingsRow
                icon={Fingerprint}
                label="Passkey Authentication"
                description={passkey ? "Active — biometric login enabled" : "Biometric login — the 2026 standard"}
              >
                <ToggleSwitch
                  enabled={passkey}
                  onChange={handleTogglePasskey}
                  color="matrix"
                  loading={isPending}
                />
              </SettingsRow>

              {/* Last Login Info */}
              <div className="mt-1 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
                <span className="mb-3 block text-[10px] font-medium uppercase tracking-widest text-white/20">
                  Last Login Details
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-white/15" />
                    <span className="text-white/30">Time</span>
                    <span className="ml-auto font-mono text-white/50">{lastLogin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Globe className="h-3.5 w-3.5 text-white/15" />
                    <span className="text-white/30">IP Address</span>
                    <span className="ml-auto font-mono text-white/50">{data.lastLoginIp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Monitor className="h-3.5 w-3.5 text-white/15" />
                    <span className="text-white/30">Device</span>
                    <span className="ml-auto font-mono text-white/50">{data.lastLoginDevice}</span>
                  </div>
                </div>
              </div>

              <SettingsRow
                icon={Shield}
                label="Active Sessions"
                description="1 session active (this device)"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 text-[11px] text-red-400/60 transition-colors hover:text-red-400"
                >
                  Revoke all
                  <ChevronRight className="h-3 w-3" />
                </motion.button>
              </SettingsRow>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ──── RESPONSIBLE GAMING ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassPanel glow="matrix" className="p-6">
            <SectionHeader
              icon={CircleDollarSign}
              title="Responsible Gaming"
              subtitle="Set limits to stay in control"
            />

            <div className="flex flex-col gap-5">
              {/* Deposit Limits */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-white/40">
                  Deposit Limits
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <LimitSelector
                    label="Daily"
                    value={dailyLimit}
                    onChange={setDailyLimit}
                    options={["$100", "$250", "$500", "$1,000", "None"]}
                  />
                  <LimitSelector
                    label="Weekly"
                    value={weeklyLimit}
                    onChange={setWeeklyLimit}
                    options={["$500", "$1,000", "$2,000", "$5,000", "None"]}
                  />
                  <LimitSelector
                    label="Monthly"
                    value={monthlyLimit}
                    onChange={setMonthlyLimit}
                    options={["$2,000", "$5,000", "$10,000", "$25,000", "None"]}
                  />
                </div>
              </div>

              {/* Session timeout */}
              <div>
                <SettingsRow
                  icon={Clock}
                  label="Session Timeout"
                  description="Auto-logoff after inactivity"
                >
                  <div className="flex gap-1.5">
                    {["30 min", "60 min", "2 hrs", "None"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSessionTimeout(opt)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                          sessionTimeout === opt
                            ? "border border-matrix/20 bg-matrix/10 text-matrix"
                            : "border border-white/[0.04] text-white/20 hover:text-white/40"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </SettingsRow>
              </div>

              {/* Self-exclusion */}
              <div className="rounded-xl border border-matrix/10 bg-matrix/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <Ban className="mt-0.5 h-5 w-5 shrink-0 text-matrix/60" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-matrix/80">
                      Self-Exclusion
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/25">
                      {data.isSelfExcluded
                        ? `You are currently self-excluded${
                            data.selfExcludeUntil
                              ? ` until ${new Date(data.selfExcludeUntil).toLocaleDateString()}`
                              : ""
                          }.`
                        : "Temporarily or permanently restrict your access. This action cannot be reversed for the selected period."}
                    </p>
                    <AnimatePresence>
                      {selfExcludeOpen && !data.isSelfExcluded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 flex flex-wrap gap-2"
                        >
                          {["24 Hours", "7 Days", "30 Days", "6 Months", "Permanent"].map(
                            (period) => (
                              <button
                                key={period}
                                onClick={() => handleSelfExclude(period)}
                                disabled={excludePending}
                                className="rounded-lg border border-matrix/15 bg-matrix/[0.04] px-3 py-1.5 text-[11px] font-medium text-matrix/60 transition-all hover:border-matrix/30 hover:bg-matrix/10 hover:text-matrix disabled:opacity-40"
                              >
                                {period}
                              </button>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {!data.isSelfExcluded && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelfExcludeOpen(!selfExcludeOpen)}
                      className="shrink-0 rounded-lg border border-matrix/20 bg-matrix/10 px-3 py-1.5 text-[11px] font-semibold text-matrix transition-all hover:bg-matrix/20"
                    >
                      {selfExcludeOpen ? "Cancel" : "Configure"}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ──── WALLET & TRANSACTIONS ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassPanel glow="gold" className="p-6">
            <SectionHeader
              icon={Wallet}
              title="Wallet"
              subtitle="Link wallets and view transaction history"
            />

            <div className="flex flex-col gap-3">
              {/* Phantom */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                    <span className="text-base">👻</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Phantom</p>
                    <p className="text-[10px] text-white/20">
                      {phantomLinked ? "Connected: 8x3f...a2d1" : "Not connected"}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhantomLinked(!phantomLinked)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    phantomLinked
                      ? "border-matrix/20 text-matrix hover:border-red-500/20 hover:text-red-400"
                      : "border-purple-500/20 bg-purple-500/[0.06] text-purple-300 hover:bg-purple-500/10"
                  }`}
                >
                  {phantomLinked ? (
                    <>
                      <Check className="h-3 w-3" />
                      Linked
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      Connect
                    </>
                  )}
                </motion.button>
              </div>

              {/* MetaMask */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                    <span className="text-base">🦊</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">MetaMask</p>
                    <p className="text-[10px] text-white/20">
                      {metamaskLinked ? "Connected: 0xAb...9F21" : "Not connected"}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMetamaskLinked(!metamaskLinked)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    metamaskLinked
                      ? "border-matrix/20 text-matrix hover:border-red-500/20 hover:text-red-400"
                      : "border-orange-500/20 bg-orange-500/[0.06] text-orange-300 hover:bg-orange-500/10"
                  }`}
                >
                  {metamaskLinked ? (
                    <>
                      <Check className="h-3 w-3" />
                      Linked
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      Connect
                    </>
                  )}
                </motion.button>
              </div>

              {/* Real transaction history */}
              <div className="mt-2 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/40">
                    Recent Transactions
                  </span>
                  <span className="font-mono text-[10px] text-white/15">
                    Last {data.recentTransactions.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {data.recentTransactions.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-white/15">
                      No transactions yet
                    </p>
                  ) : (
                    data.recentTransactions.map((tx, i) => {
                      const TxIcon = txIcon(tx.reason);
                      const color = txColor(tx.reason);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <TxIcon className={`h-3 w-3 shrink-0 ${color}`} />
                            <span className="truncate text-white/40">
                              {tx.description || tx.reason.replace("_", " ").toLowerCase()}
                            </span>
                          </div>
                          <span className={`shrink-0 font-mono font-medium ${color}`}>
                            {tx.amount >= 0 ? "+" : ""}
                            {tx.amount.toFixed(2)}
                          </span>
                          <span className="shrink-0 ml-3 text-white/15">{tx.time}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ──── DANGER ZONE ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassPanel glow="none" className="border-red-500/[0.08] p-6">
            <SectionHeader
              icon={AlertTriangle}
              title="Danger Zone"
              subtitle="Irreversible account actions"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-xl border border-red-500/10 bg-red-500/[0.04] py-3 text-xs font-medium text-red-400/60 transition-all hover:border-red-500/20 hover:text-red-400"
              >
                Delete Account
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] py-3 text-xs font-medium text-white/25 transition-all hover:text-white/50"
              >
                Export Data
              </motion.button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Save bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between gap-3 pb-8"
        >
          {saveError && (
            <p className="text-[11px] text-red-400">{saveError}</p>
          )}
          <div className="ml-auto flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setUsername(data.username);
                setAvatar(data.avatar);
                setDailyLimit(data.depositLimits.daily);
                setWeeklyLimit(data.depositLimits.weekly);
                setMonthlyLimit(data.depositLimits.monthly);
                setSessionTimeout(data.sessionTimeout);
                setUsernameError("");
              }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-3 text-xs font-medium text-white/30 transition-all hover:text-white/60"
            >
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={isPending}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-60 ${
                saved
                  ? "border border-matrix/20 bg-matrix/20 text-matrix"
                  : "bg-gradient-to-r from-gold to-amber-500 text-obsidian cta-glow"
              }`}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  SAVED
                </>
              ) : (
                "SAVE CHANGES"
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
