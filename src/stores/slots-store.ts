import { create } from "zustand";

interface PaylineResult {
  line: number;
  symbols: number;
  payout: number;
}

interface SlotHistory {
  grid: number[][];
  paylines: PaylineResult[];
  totalPayout: number;
  scatterCount: number;
  isScatterWin: boolean;
  betAmount: number;
}

interface SlotsState {
  betAmount: number;
  spinning: boolean;
  grid: number[][];
  paylines: PaylineResult[];
  totalPayout: number;
  scatterCount: number;
  isScatterWin: boolean;
  serverSeed: string;
  seedHash: string;
  clientSeed: string;
  nonce: number;
  history: SlotHistory[];

  setBetAmount: (a: number) => void;
  setClientSeed: (s: string) => void;
  startSpin: () => void;
  finishSpin: (data: {
    grid: number[][];
    paylines: PaylineResult[];
    totalPayout: number;
    scatterCount: number;
    isScatterWin: boolean;
    serverSeed: string;
    seedHash: string;
  }) => void;
  reset: () => void;
}

const EMPTY_GRID: number[][] = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];

export const useSlotsStore = create<SlotsState>((set, get) => ({
  betAmount: 0.1,
  spinning: false,
  grid: EMPTY_GRID,
  paylines: [],
  totalPayout: 0,
  scatterCount: 0,
  isScatterWin: false,
  serverSeed: "",
  seedHash: "",
  clientSeed: Math.random().toString(36).slice(2, 10),
  nonce: 0,
  history: [],

  setBetAmount: (a) => set({ betAmount: Math.max(0.01, a) }),
  setClientSeed: (s) => set({ clientSeed: s }),

  startSpin: () =>
    set({
      spinning: true,
      paylines: [],
      totalPayout: 0,
      scatterCount: 0,
      isScatterWin: false,
    }),

  finishSpin: (data) => {
    const s = get();
    const entry: SlotHistory = {
      grid: data.grid,
      paylines: data.paylines,
      totalPayout: data.totalPayout,
      scatterCount: data.scatterCount,
      isScatterWin: data.isScatterWin,
      betAmount: s.betAmount,
    };
    set({
      spinning: false,
      grid: data.grid,
      paylines: data.paylines,
      totalPayout: data.totalPayout,
      scatterCount: data.scatterCount,
      isScatterWin: data.isScatterWin,
      serverSeed: data.serverSeed,
      seedHash: data.seedHash,
      nonce: s.nonce + 1,
      history: [entry, ...s.history].slice(0, 10),
    });
  },

  reset: () =>
    set({
      spinning: false,
      grid: EMPTY_GRID,
      paylines: [],
      totalPayout: 0,
      scatterCount: 0,
      isScatterWin: false,
      serverSeed: "",
      seedHash: "",
    }),
}));
