import { create } from "zustand";

export type VaultPhase = "idle" | "hacking" | "breached" | "busted";

export const VAULT_MULTIPLIERS = [1.45, 2.18, 3.27, 4.90, 7.35, 11.02, 16.54, 24.81];
export const VAULT_FLOORS = 8;
export const NODES_PER_FLOOR = 3;

export interface RevealedFloor {
  floor: number;
  nodeIndex: number;
}

export interface VaultState {
  phase: VaultPhase;
  betAmount: number;
  currentFloor: number;
  revealedFloors: RevealedFloor[];
  trapPositions: number[];
  multiplier: number;
  serverSeedHash: string;
  serverSeed: string;
  payout: number;
  clientSeed: string;
  nonce: number;

  setBetAmount: (amount: number) => void;
  setClientSeed: (seed: string) => void;

  startHack: (seedHash: string, nonce: number) => void;
  revealNode: (floor: number, nodeIndex: number, multiplier: number) => void;
  hitFirewall: (trapPositions: number[], serverSeed: string) => void;
  extractLoot: (payout: number, serverSeed: string) => void;
  reset: () => void;
}

const INITIAL: Pick<
  VaultState,
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

export const useVaultStore = create<VaultState>((set, get) => ({
  ...INITIAL,
  betAmount: 0.1,
  clientSeed: Math.random().toString(36).slice(2, 10),
  nonce: 0,

  setBetAmount: (amount) => set({ betAmount: Math.max(0.01, amount) }),
  setClientSeed: (seed) => set({ clientSeed: seed }),

  startHack: (seedHash, nonce) =>
    set({
      phase: "hacking",
      serverSeedHash: seedHash,
      nonce,
      currentFloor: 0,
      revealedFloors: [],
      trapPositions: [],
      multiplier: 0,
      serverSeed: "",
      payout: 0,
    }),

  revealNode: (floor, nodeIndex, multiplier) => {
    const { revealedFloors } = get();
    set({
      revealedFloors: [...revealedFloors, { floor, nodeIndex }],
      currentFloor: floor + 1,
      multiplier,
    });
  },

  hitFirewall: (trapPositions, serverSeed) =>
    set({
      phase: "busted",
      trapPositions,
      serverSeed,
      payout: 0,
    }),

  extractLoot: (payout, serverSeed) =>
    set({
      phase: "breached",
      serverSeed,
      payout,
    }),

  reset: () =>
    set({
      ...INITIAL,
      nonce: get().nonce + 1,
    }),
}));
