# ENGINE & MATH LOGIC
## 1. Randomness (RNG)
- Never use `Math.random()`. Use `crypto.getRandomValues()` for provably fair seeds.
## 2. Real-Time Updates
- Use WebSockets for "The Ledger" win feed to ensure zero-latency updates.
- Wallet balances must update instantly across all components without a page refresh (use TanStack Query or Zustand).
## 3. Game State
- All game results must be calculated server-side; the client is only for visualization.