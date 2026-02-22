import { create } from "zustand";

export type PlinkoRisk = "low" | "medium" | "high";

interface PlinkoState {
  betAmount: number;
  risk: PlinkoRisk;
  rows: number;
  isDropping: boolean;
  path: number[];
  bucket: number;
  multiplier: number;
  payout: number;
  serverSeed: string;
  seedHash: string;
  history: { multiplier: number; payout: number }[];
  nonce: number;

  setBetAmount: (a: number) => void;
  setRisk: (r: PlinkoRisk) => void;
  setRows: (r: number) => void;
  startDrop: (
    path: number[],
    bucket: number,
    multiplier: number,
    payout: number,
    serverSeed: string,
    seedHash: string
  ) => void;
  finishDrop: () => void;
  reset: () => void;
}

export const usePlinkoStore = create<PlinkoState>((set, get) => ({
  betAmount: 1,
  risk: "medium",
  rows: 16,
  isDropping: false,
  path: [],
  bucket: -1,
  multiplier: 0,
  payout: 0,
  serverSeed: "",
  seedHash: "",
  history: [],
  nonce: 0,

  setBetAmount: (a) => set({ betAmount: Math.max(0.01, a) }),
  setRisk: (r) => set({ risk: r }),
  setRows: (r) => set({ rows: r }),

  startDrop: (path, bucket, multiplier, payout, serverSeed, seedHash) =>
    set({
      isDropping: true,
      path,
      bucket,
      multiplier,
      payout,
      serverSeed,
      seedHash,
    }),

  finishDrop: () => {
    const { multiplier, payout, history } = get();
    set({
      isDropping: false,
      history: [{ multiplier, payout }, ...history].slice(0, 10),
      nonce: get().nonce + 1,
    });
  },

  reset: () =>
    set({
      path: [],
      bucket: -1,
      multiplier: 0,
      payout: 0,
      serverSeed: "",
      seedHash: "",
    }),
}));
