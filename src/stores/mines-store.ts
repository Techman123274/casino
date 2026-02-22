import { create } from "zustand";
import { computeMultiplier, nextTileMultiplier } from "@/lib/fairness";

export type GamePhase = "idle" | "betting" | "playing" | "cashing-out" | "won" | "lost";

export interface MinesState {
  phase: GamePhase;
  betAmount: number;
  minesCount: number;
  revealedTiles: number[];
  minePositions: number[];
  multiplier: number;
  nextTileValue: number;
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  payout: number;

  setBetAmount: (amount: number) => void;
  setMinesCount: (count: number) => void;
  setClientSeed: (seed: string) => void;

  startGame: (seedHash: string, nonce: number) => void;
  revealTile: (index: number) => void;
  hitMine: (minePositions: number[], serverSeed: string) => void;
  cashOut: (payout: number, serverSeed: string) => void;
  reset: () => void;
}

const INITIAL: Pick<
  MinesState,
  | "phase" | "revealedTiles" | "minePositions" | "multiplier"
  | "nextTileValue" | "serverSeedHash" | "serverSeed" | "payout"
> = {
  phase: "idle",
  revealedTiles: [],
  minePositions: [],
  multiplier: 1,
  nextTileValue: 1,
  serverSeedHash: "",
  serverSeed: "",
  payout: 0,
};

export const useMinesStore = create<MinesState>((set, get) => ({
  ...INITIAL,
  betAmount: 0.1,
  minesCount: 3,
  clientSeed: Math.random().toString(36).slice(2, 10),
  nonce: 0,

  setBetAmount: (amount) => set({ betAmount: Math.max(0.01, amount) }),
  setMinesCount: (count) => set({ minesCount: Math.min(24, Math.max(1, count)) }),
  setClientSeed: (seed) => set({ clientSeed: seed }),

  startGame: (seedHash, nonce) => {
    const { minesCount } = get();
    set({
      phase: "playing",
      serverSeedHash: seedHash,
      nonce,
      revealedTiles: [],
      minePositions: [],
      multiplier: 1,
      nextTileValue: nextTileMultiplier(minesCount, 0),
      serverSeed: "",
      payout: 0,
    });
  },

  revealTile: (index) => {
    const { revealedTiles, minesCount } = get();
    if (revealedTiles.includes(index)) return;
    const newRevealed = [...revealedTiles, index];
    const mult = computeMultiplier(minesCount, newRevealed.length);
    const nextVal = nextTileMultiplier(minesCount, newRevealed.length);
    set({
      revealedTiles: newRevealed,
      multiplier: mult,
      nextTileValue: nextVal,
    });
  },

  hitMine: (minePositions, serverSeed) =>
    set({
      phase: "lost",
      minePositions,
      serverSeed,
      payout: 0,
    }),

  cashOut: (payout, serverSeed) =>
    set({
      phase: "won",
      serverSeed,
      payout,
    }),

  reset: () =>
    set({
      ...INITIAL,
      nonce: get().nonce + 1,
    }),
}));
