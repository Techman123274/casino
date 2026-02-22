import { create } from "zustand";

interface DiceHistory {
  roll: number;
  target: number;
  isOver: boolean;
  won: boolean;
  multiplier: number;
  payout: number;
}

interface DiceState {
  betAmount: number;
  target: number;
  isOver: boolean;
  rolling: boolean;
  lastRoll: number | null;
  lastWon: boolean | null;
  lastMultiplier: number;
  lastPayout: number;
  serverSeed: string;
  seedHash: string;
  clientSeed: string;
  nonce: number;
  history: DiceHistory[];

  setBetAmount: (a: number) => void;
  setTarget: (t: number) => void;
  setIsOver: (o: boolean) => void;
  setClientSeed: (s: string) => void;
  startRoll: () => void;
  finishRoll: (
    roll: number,
    won: boolean,
    multiplier: number,
    payout: number,
    serverSeed: string,
    seedHash: string
  ) => void;
  reset: () => void;
}

export const useDiceStore = create<DiceState>((set, get) => ({
  betAmount: 0.1,
  target: 50,
  isOver: true,
  rolling: false,
  lastRoll: null,
  lastWon: null,
  lastMultiplier: 0,
  lastPayout: 0,
  serverSeed: "",
  seedHash: "",
  clientSeed: Math.random().toString(36).slice(2, 10),
  nonce: 0,
  history: [],

  setBetAmount: (a) => set({ betAmount: Math.max(0.01, a) }),
  setTarget: (t) => set({ target: Math.min(98, Math.max(1, t)) }),
  setIsOver: (o) => set({ isOver: o }),
  setClientSeed: (s) => set({ clientSeed: s }),

  startRoll: () => set({ rolling: true, lastRoll: null, lastWon: null }),

  finishRoll: (roll, won, multiplier, payout, serverSeed, seedHash) => {
    const s = get();
    const entry: DiceHistory = {
      roll,
      target: s.target,
      isOver: s.isOver,
      won,
      multiplier,
      payout,
    };
    set({
      rolling: false,
      lastRoll: roll,
      lastWon: won,
      lastMultiplier: multiplier,
      lastPayout: payout,
      serverSeed,
      seedHash,
      nonce: s.nonce + 1,
      history: [entry, ...s.history].slice(0, 20),
    });
  },

  reset: () =>
    set({
      rolling: false,
      lastRoll: null,
      lastWon: null,
      lastMultiplier: 0,
      lastPayout: 0,
      serverSeed: "",
      seedHash: "",
    }),
}));
