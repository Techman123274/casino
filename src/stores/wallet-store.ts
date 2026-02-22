import { create } from "zustand";

export type Currency = "RC" | "BTC" | "ETH";

export interface CurrencyConfig {
  symbol: string;
  icon: string;
  label: string;
  decimals: number;
  color: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  RC: { symbol: "RC", icon: "◆", label: "Rapid Credits", decimals: 2, color: "#FFD700" },
  BTC: { symbol: "BTC", icon: "₿", label: "Bitcoin", decimals: 8, color: "#F7931A" },
  ETH: { symbol: "ETH", icon: "Ξ", label: "Ethereum", decimals: 6, color: "#627EEA" },
};

interface WalletState {
  activeCurrency: Currency;
  balances: Record<Currency, string>;
  pulseKey: number;

  setActiveCurrency: (c: Currency) => void;
  setBalance: (currency: Currency, value: string) => void;
  deduct: (currency: Currency, amount: number) => void;
  credit: (currency: Currency, amount: number) => void;
  getActiveBalance: () => string;
  getActiveConfig: () => CurrencyConfig;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  activeCurrency: "RC",
  balances: { RC: "0.00", BTC: "0.00000000", ETH: "0.000000" },
  pulseKey: 0,

  setActiveCurrency: (activeCurrency) => set({ activeCurrency }),

  setBalance: (currency, value) => {
    const prev = parseFloat(get().balances[currency]);
    const next = parseFloat(value);
    set({
      balances: { ...get().balances, [currency]: value },
      pulseKey: next > prev ? get().pulseKey + 1 : get().pulseKey,
    });
  },

  deduct: (currency, amount) => {
    const cfg = CURRENCIES[currency];
    const current = parseFloat(get().balances[currency]) || 0;
    const next = Math.max(0, current - amount).toFixed(cfg.decimals);
    set({ balances: { ...get().balances, [currency]: next } });
  },

  credit: (currency, amount) => {
    const cfg = CURRENCIES[currency];
    const current = parseFloat(get().balances[currency]) || 0;
    const next = (current + amount).toFixed(cfg.decimals);
    set({
      balances: { ...get().balances, [currency]: next },
      pulseKey: get().pulseKey + 1,
    });
  },

  getActiveBalance: () => {
    const state = get();
    return state.balances[state.activeCurrency];
  },

  getActiveConfig: () => {
    return CURRENCIES[get().activeCurrency];
  },
}));
