import { create } from "zustand";

export type CrashPhase = "waiting" | "betting" | "running" | "crashed";

export interface LedgerPlayer {
  userId: string;
  username: string;
  avatar: string;
  amount: number;
  cashedOut: boolean;
  cashoutMult: number;
  payout: number;
}

export interface CashOutEvent {
  id: number;
  user: string;
  avatar: string;
  multiplier: number;
  payout: number;
  timestamp: number;
  isPlayer: boolean;
}

interface CrashState {
  phase: CrashPhase;
  multiplier: number;
  crashPoint: number;
  seedHash: string;
  serverSeed: string;
  roundId: number;
  countdown: number;

  betAmount: number;
  autoCashout: number;
  hasBet: boolean;
  hasCashedOut: boolean;
  cashoutMultiplier: number;
  payout: number;

  players: LedgerPlayer[];
  cashOuts: CashOutEvent[];
  history: number[];

  /** Threshold flags for particle/shake effects */
  milestone: number;

  setPhase: (p: CrashPhase) => void;
  setMultiplier: (m: number) => void;
  setCrashPoint: (c: number) => void;
  setSeedHash: (h: string) => void;
  setServerSeed: (s: string) => void;
  setRoundId: (n: number) => void;
  setCountdown: (c: number) => void;
  setMilestone: (m: number) => void;

  setBetAmount: (a: number) => void;
  setAutoCashout: (a: number) => void;
  placeBet: () => void;
  cashOut: (mult: number, payout: number) => void;
  setPlayers: (p: LedgerPlayer[]) => void;
  updatePlayer: (userId: string, updates: Partial<LedgerPlayer>) => void;
  addCashOut: (event: CashOutEvent) => void;
  setHistory: (h: number[]) => void;
  addHistory: (point: number) => void;

  resetRound: () => void;
}

let cashOutId = 0;

export const useCrashStore = create<CrashState>((set, get) => ({
  phase: "waiting",
  multiplier: 1.0,
  crashPoint: 0,
  seedHash: "",
  serverSeed: "",
  roundId: 0,
  countdown: 0,

  betAmount: 100,
  autoCashout: 0,
  hasBet: false,
  hasCashedOut: false,
  cashoutMultiplier: 0,
  payout: 0,

  players: [],
  cashOuts: [],
  history: [],
  milestone: 0,

  setPhase: (phase) => set({ phase }),
  setMultiplier: (multiplier) => {
    const prev = get().milestone;
    let milestone = prev;
    if (multiplier >= 50 && prev < 50) milestone = 50;
    else if (multiplier >= 10 && prev < 10) milestone = 10;
    else if (multiplier >= 2 && prev < 2) milestone = 2;
    set({ multiplier, milestone });
  },
  setCrashPoint: (crashPoint) => set({ crashPoint }),
  setSeedHash: (seedHash) => set({ seedHash }),
  setServerSeed: (serverSeed) => set({ serverSeed }),
  setRoundId: (roundId) => set({ roundId }),
  setCountdown: (countdown) => set({ countdown }),
  setMilestone: (milestone) => set({ milestone }),

  setBetAmount: (betAmount) => set({ betAmount: Math.max(1, betAmount) }),
  setAutoCashout: (autoCashout) => set({ autoCashout: Math.max(0, autoCashout) }),
  placeBet: () => set({ hasBet: true }),
  cashOut: (mult, payout) => set({ hasCashedOut: true, cashoutMultiplier: mult, payout }),

  setPlayers: (players) => set({ players }),
  updatePlayer: (userId, updates) => {
    const players = get().players.map((p) =>
      p.userId === userId ? { ...p, ...updates } : p
    );
    set({ players });
  },

  addCashOut: (event) => {
    set({ cashOuts: [event, ...get().cashOuts].slice(0, 40) });
  },

  setHistory: (history) => set({ history }),
  addHistory: (point) => {
    set({ history: [point, ...get().history].slice(0, 30) });
  },

  resetRound: () =>
    set({
      phase: "waiting",
      multiplier: 1.0,
      crashPoint: 0,
      serverSeed: "",
      hasBet: false,
      hasCashedOut: false,
      cashoutMultiplier: 0,
      payout: 0,
      players: [],
      cashOuts: [],
      milestone: 0,
    }),
}));

export function nextCashOutId() {
  return ++cashOutId;
}
