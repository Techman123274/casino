export type TableCategory = "all" | "roulette" | "blackjack" | "baccarat" | "game-shows";

export interface LiveTable {
  id: string;
  name: string;
  category: Exclude<TableCategory, "all">;
  dealer: {
    name: string;
    avatar: string;
  };
  playerCount: number;
  minBet: number;
  maxBet: number;
  isVip: boolean;
  thumbnailGradient: string;
  accentColor: string;
}

const DEALER_NAMES = [
  "Elena V.", "Marco R.", "Sofia K.", "James L.", "Aria M.",
  "Viktor S.", "Luna C.", "Daniel P.", "Natasha B.", "Oscar W.",
  "Mei L.", "Alexandre D.", "Isabella F.", "Raj P.", "Chloe T.",
  "Nikolai K.", "Yumi H.", "Carlos M.", "Freya N.", "Liam O.",
];

const TABLE_TEMPLATES: Omit<LiveTable, "id" | "playerCount" | "dealer">[] = [
  { name: "Quantum Roulette", category: "roulette", minBet: 1, maxBet: 5000, isVip: false, thumbnailGradient: "from-red-900/80 via-rose-950/60 to-obsidian", accentColor: "text-red-400" },
  { name: "Lightning Roulette", category: "roulette", minBet: 0.5, maxBet: 10000, isVip: false, thumbnailGradient: "from-amber-900/80 via-yellow-950/60 to-obsidian", accentColor: "text-amber-400" },
  { name: "VIP Roulette Elite", category: "roulette", minBet: 50, maxBet: 50000, isVip: true, thumbnailGradient: "from-gold/30 via-amber-950/60 to-obsidian", accentColor: "text-gold" },
  { name: "Auto Roulette", category: "roulette", minBet: 0.1, maxBet: 2000, isVip: false, thumbnailGradient: "from-emerald-900/80 via-green-950/60 to-obsidian", accentColor: "text-emerald-400" },
  { name: "Speed Roulette", category: "roulette", minBet: 1, maxBet: 8000, isVip: false, thumbnailGradient: "from-orange-900/80 via-red-950/60 to-obsidian", accentColor: "text-orange-400" },
  { name: "Infinite Blackjack", category: "blackjack", minBet: 1, maxBet: 5000, isVip: false, thumbnailGradient: "from-slate-800/80 via-zinc-900/60 to-obsidian", accentColor: "text-sky-400" },
  { name: "Neon Blackjack", category: "blackjack", minBet: 5, maxBet: 10000, isVip: false, thumbnailGradient: "from-cyan-900/80 via-blue-950/60 to-obsidian", accentColor: "text-cyan-400" },
  { name: "VIP Blackjack Salon", category: "blackjack", minBet: 100, maxBet: 100000, isVip: true, thumbnailGradient: "from-gold/30 via-slate-900/60 to-obsidian", accentColor: "text-gold" },
  { name: "Speed Blackjack", category: "blackjack", minBet: 2, maxBet: 5000, isVip: false, thumbnailGradient: "from-indigo-900/80 via-violet-950/60 to-obsidian", accentColor: "text-indigo-400" },
  { name: "Power Blackjack", category: "blackjack", minBet: 1, maxBet: 3000, isVip: false, thumbnailGradient: "from-purple-900/80 via-fuchsia-950/60 to-obsidian", accentColor: "text-purple-400" },
  { name: "Baccarat Prestige", category: "baccarat", minBet: 5, maxBet: 25000, isVip: false, thumbnailGradient: "from-rose-900/80 via-pink-950/60 to-obsidian", accentColor: "text-rose-400" },
  { name: "Speed Baccarat", category: "baccarat", minBet: 1, maxBet: 5000, isVip: false, thumbnailGradient: "from-teal-900/80 via-emerald-950/60 to-obsidian", accentColor: "text-teal-400" },
  { name: "No Commission Baccarat", category: "baccarat", minBet: 2, maxBet: 8000, isVip: false, thumbnailGradient: "from-violet-900/80 via-purple-950/60 to-obsidian", accentColor: "text-violet-400" },
  { name: "VIP Baccarat", category: "baccarat", minBet: 200, maxBet: 200000, isVip: true, thumbnailGradient: "from-gold/30 via-rose-950/60 to-obsidian", accentColor: "text-gold" },
  { name: "Dragon Tiger", category: "baccarat", minBet: 0.5, maxBet: 3000, isVip: false, thumbnailGradient: "from-red-900/80 via-orange-950/60 to-obsidian", accentColor: "text-red-400" },
  { name: "Crazy Time", category: "game-shows", minBet: 0.5, maxBet: 5000, isVip: false, thumbnailGradient: "from-yellow-800/80 via-orange-950/60 to-obsidian", accentColor: "text-yellow-400" },
  { name: "Monopoly Live", category: "game-shows", minBet: 0.5, maxBet: 5000, isVip: false, thumbnailGradient: "from-green-800/80 via-emerald-950/60 to-obsidian", accentColor: "text-green-400" },
  { name: "Dream Catcher", category: "game-shows", minBet: 0.5, maxBet: 10000, isVip: false, thumbnailGradient: "from-blue-800/80 via-indigo-950/60 to-obsidian", accentColor: "text-blue-400" },
  { name: "Deal or No Deal", category: "game-shows", minBet: 1, maxBet: 5000, isVip: false, thumbnailGradient: "from-orange-800/80 via-amber-950/60 to-obsidian", accentColor: "text-orange-400" },
  { name: "Funky Time", category: "game-shows", minBet: 0.5, maxBet: 8000, isVip: false, thumbnailGradient: "from-fuchsia-800/80 via-pink-950/60 to-obsidian", accentColor: "text-fuchsia-400" },
  { name: "Cash or Crash", category: "game-shows", minBet: 1, maxBet: 10000, isVip: false, thumbnailGradient: "from-sky-800/80 via-blue-950/60 to-obsidian", accentColor: "text-sky-400" },
  { name: "Mega Ball", category: "game-shows", minBet: 0.5, maxBet: 5000, isVip: false, thumbnailGradient: "from-purple-800/80 via-violet-950/60 to-obsidian", accentColor: "text-purple-400" },
  { name: "European Roulette", category: "roulette", minBet: 1, maxBet: 5000, isVip: false, thumbnailGradient: "from-emerald-800/80 via-teal-950/60 to-obsidian", accentColor: "text-emerald-400" },
  { name: "Salon Privé Blackjack", category: "blackjack", minBet: 500, maxBet: 250000, isVip: true, thumbnailGradient: "from-gold/40 via-amber-950/50 to-obsidian", accentColor: "text-gold" },
  { name: "Lightning Baccarat", category: "baccarat", minBet: 1, maxBet: 10000, isVip: false, thumbnailGradient: "from-amber-800/80 via-yellow-950/60 to-obsidian", accentColor: "text-amber-400" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMockTables(): LiveTable[] {
  const rng = seededRandom(42);
  return TABLE_TEMPLATES.map((template, i) => ({
    ...template,
    id: `live-${i + 1}`,
    playerCount: Math.floor(rng() * 2400) + 50,
    dealer: {
      name: DEALER_NAMES[i % DEALER_NAMES.length],
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${DEALER_NAMES[i % DEALER_NAMES.length].replace(/\s/g, "")}`,
    },
  }));
}

const PAGE_SIZE = 8;

export function paginateTables(
  tables: LiveTable[],
  page: number,
  category: TableCategory,
  search: string
): { data: LiveTable[]; nextPage: number | null; total: number } {
  let filtered = tables;

  if (category !== "all") {
    filtered = filtered.filter((t) => t.category === category);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.dealer.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  const start = page * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < filtered.length;

  return {
    data: slice,
    nextPage: hasMore ? page + 1 : null,
    total: filtered.length,
  };
}
