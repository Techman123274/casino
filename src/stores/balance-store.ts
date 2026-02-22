import { create } from "zustand";
import { RC_ICON, RC_SYMBOL } from "@/lib/currency";

interface BalanceState {
  credits: string;
  previousCredits: string;
  symbol: string;
  icon: string;
  /** Incremented on every credit event to trigger pulse animations */
  pulseKey: number;

  setCredits: (credits: string) => void;
  deduct: (amount: number) => void;
  credit: (amount: number) => void;

  // Aliases for backward compatibility
  balance: string;
  setBalance: (balance: string) => void;
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
  credits: "0.00",
  previousCredits: "0.00",
  symbol: RC_SYMBOL,
  icon: RC_ICON,
  pulseKey: 0,

  setCredits: (credits) => {
    const prev = get().credits;
    const incoming = parseFloat(credits);
    const previous = parseFloat(prev);
    set({
      previousCredits: prev,
      credits,
      pulseKey: incoming > previous ? get().pulseKey + 1 : get().pulseKey,
    });
  },

  deduct: (amount) => {
    const current = parseFloat(get().credits) || 0;
    const next = Math.max(0, current - amount).toFixed(2);
    set({ previousCredits: get().credits, credits: next });
  },

  credit: (amount) => {
    const current = parseFloat(get().credits) || 0;
    const next = (current + amount).toFixed(2);
    set({
      previousCredits: get().credits,
      credits: next,
      pulseKey: get().pulseKey + 1,
    });
  },

  // Backward-compat getters/setters that map to credits
  get balance() {
    return get().credits;
  },
  setBalance: (balance: string) => {
    get().setCredits(balance);
  },
}));
