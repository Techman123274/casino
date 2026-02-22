import { create } from "zustand";

export type TowersPhase = "idle" | "playing" | "won" | "lost";
export type TowersDifficulty = "easy" | "medium" | "hard";

const MULTIPLIERS: Record<TowersDifficulty, number[]> = {
  easy: [1.31, 1.72, 2.25, 2.96, 3.88, 5.09, 6.68, 8.77, 11.51, 15.11],
  medium: [1.90, 3.61, 6.86, 13.03, 24.76, 47.04, 89.38, 169.82, 322.66, 613.06],
  hard: [2.82, 7.96, 22.44, 63.28, 178.45, 503.15, 1418.88, 4001.24, 11283.50, 31819.47],
};

const TILES_PER_ROW: Record<TowersDifficulty, number> = {
  easy: 3,
  medium: 2,
  hard: 3,
};

export interface RevealedFloor {
  floor: number;
  tileIndex: number;
}

export interface TowersState {
  phase: TowersPhase;
  betAmount: number;
  difficulty: TowersDifficulty;
  currentFloor: number;
  revealedFloors: RevealedFloor[];
  trapPositions: number[][];
  multiplier: number;
  serverSeedHash: string;
  serverSeed: string;
  payout: number;
  clientSeed: string;
  nonce: number;

  setBetAmount: (amount: number) => void;
  setDifficulty: (d: TowersDifficulty) => void;
  setClientSeed: (seed: string) => void;

  startGame: (seedHash: string, nonce: number) => void;
  revealFloor: (floor: number, tileIndex: number, multiplier: number) => void;
  hitTrap: (trapPositions: number[][], serverSeed: string) => void;
  cashOut: (payout: number, serverSeed: string) => void;
  reset: () => void;
}

const INITIAL: Pick<
  TowersState,
  | "phase" | "currentFloor" | "revealedFloors" | "trapPositions"
  | "multiplier" | "serverSeedHash" | "serverSeed" | "payout"
> = {
  phase: "idle",
  currentFloor: 0,
  revealedFloors: [],
  trapPositions: [],
  multiplier: 0,
  serverSeedHash: "",
  serverSeed: "",
  payout: 0,
};

export const useTowersStore = create<TowersState>((set, get) => ({
  ...INITIAL,
  betAmount: 0.1,
  difficulty: "easy",
  clientSeed: Math.random().toString(36).slice(2, 10),
  nonce: 0,

  setBetAmount: (amount) => set({ betAmount: Math.max(0.01, amount) }),
  setDifficulty: (d) => set({ difficulty: d }),
  setClientSeed: (seed) => set({ clientSeed: seed }),

  startGame: (seedHash, nonce) =>
    set({
      phase: "playing",
      serverSeedHash: seedHash,
      nonce,
      currentFloor: 0,
      revealedFloors: [],
      trapPositions: [],
      multiplier: 0,
      serverSeed: "",
      payout: 0,
    }),

  revealFloor: (floor, tileIndex, multiplier) => {
    const { revealedFloors } = get();
    set({
      revealedFloors: [...revealedFloors, { floor, tileIndex }],
      currentFloor: floor + 1,
      multiplier,
    });
  },

  hitTrap: (trapPositions, serverSeed) =>
    set({
      phase: "lost",
      trapPositions,
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

export { MULTIPLIERS, TILES_PER_ROW };
