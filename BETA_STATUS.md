# RAPID ROLE — Beta Launch Status

> Last updated: Feb 21, 2026
> Stack: Next.js 15 (App Router) | Tailwind CSS 4.0 | MongoDB Atlas | NextAuth v5

---

## WHAT'S BUILT AND WORKING

### Authentication & Accounts
| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Registration | DONE | `/register` route, bcrypt hashing |
| Email/Password Login | DONE | NextAuth v5 Credentials provider |
| Login Modal (Intercepting Route) | DONE | `/(.)login` overlay + full `/login` fallback |
| MongoDB User Creation | DONE | Auto-creates user doc on sign-up with $0.00 balance |
| Session Management | DONE | JWT strategy via NextAuth |
| Logout | DONE | Via NextAuth signOut |

### Dashboard Shell
| Feature | Status | Notes |
|---------|--------|-------|
| 3-Column Layout (Sidebar + Main + Feed) | DONE | Responsive, collapses on mobile |
| TopNav with Wallet Display | DONE | Shows live RC balance, deposit button |
| Sidebar Navigation | DONE | Links to Dashboard, Originals, Live, Promotions, Settings |
| Active Route Highlighting | DONE | Electric Gold active state |
| Terminal Feed (The Ledger) | DONE | Real-time mock win/loss feed |
| Animated Mesh Gradient Background | DONE | Cyber-Luxe obsidian with gold/matrix gradients |
| GlassPanel Component | DONE | Reusable glassmorphic panel, gold/matrix glow variants |

### Landing Page (Pre-Login)
| Feature | Status | Notes |
|---------|--------|-------|
| Cinematic Hero Section | DONE | Digital rain, glitch text, CTA |
| Rapid Originals Cards | DONE | Glassmorphic cards with hover effects |
| Live Ledger Ticker | DONE | Scrolling win feed |
| The Vault (Lobby Teaser) | DONE | 2-column section |
| VIP Comparison Table | DONE | "Rapid vs. Rest" |
| Scroll Progress Bar | DONE | 1px Electric Gold bar |
| Smooth Scrolling (Lenis) | DONE | Momentum-based scroll |
| Sticky "Enter the Arena" CTA | DONE | Appears on scroll in header |

### Games — Rapid Originals (5/5 Functional)
| Game | Route | Provably Fair | Balance Integration | Bet Recording | Performance |
|------|-------|---------------|--------------------|--------------:|-------------|
| Crypto Mines | `/dashboard/originals/mines` | SHA-256 commit-reveal | Deduct on bet, credit on cashout | Bet + Transaction models | GPU-accelerated tiles |
| Lunar Crash | `/dashboard/originals/crash` | HMAC-SHA256 hash chain | Deduct on bet, credit on cashout | Bet + Transaction + GameRound | 20Hz tick, lerp rocket, state-lock on crash |
| Neon Plinko | `/dashboard/originals/plinko` | HMAC-SHA256 path derivation | Deduct on bet, credit on win | Bet + Transaction | Canvas ball animation with damp() interpolation |
| Shadow Dice | `/dashboard/originals/dice` | HMAC-SHA256 roll derivation | Instant settle (bet + payout) | Bet + Transaction | Canvas slider, interval cleanup |
| Void Towers | `/dashboard/originals/towers` | HMAC-SHA256 per-floor traps | Deduct on bet, credit on cashout | Bet + Transaction | GPU tiles, state-lock on loss |

### Economy System
| Feature | Status | Notes |
|---------|--------|-------|
| Rapid Credits (RC) Currency | DONE | Decimal128 precision, format utilities |
| Test Deposit (Dev Mode) | DONE | "DEPOSIT" button in TopNav, adds RC |
| Daily Faucet (100 RC/day) | DONE | `/dashboard/promotions`, 24hr cooldown |
| Promo Code Redemption | DONE | Coupon model, single-use-per-user validation |
| Balance Store (Zustand) | DONE | Real-time balance sync across all games |
| Transaction Logging | DONE | Every credit/debit recorded with reason, meta |
| Vault Tracking | DONE | wageredCredits, bonusCredits, lifetimeEarnings |

### Settings Page
| Feature | Status | Notes |
|---------|--------|-------|
| Account Info (username, email, join date) | DONE | Server Component data fetch |
| Update Username | DONE | Server Action with uniqueness validation |
| Update Avatar | DONE | Server Action |
| Last Login Details | DONE | IP, device, timestamp |
| 2FA Toggle | DONE | Updates DB (UI toggle only, no actual TOTP) |
| Passkey Toggle | DONE | Updates DB (UI toggle only, no actual WebAuthn) |
| Deposit Limits (daily/weekly/monthly) | DONE | Functional sliders, persisted to DB |
| Session Timeout Selector | DONE | Persisted to DB |
| Self-Exclusion | DONE | Configurable periods, persisted |
| Lifetime Stats | DONE | Aggregated from Bet collection |
| VIP Progress Bar | DONE | Animated, based on XP |
| Recent Transaction History | DONE | Last 20 transactions from DB |

### Live Casino
| Feature | Status | Notes |
|---------|--------|-------|
| Live Lobby UI | DONE | Grid of table cards |
| Category Filters | DONE | Sticky filter bar |
| Search | DONE | Real-time search |
| Pagination | DONE | API-driven |
| Table Cards | DONE | Provider, limits, player count |

### Performance Layer
| Feature | Status | Notes |
|---------|--------|-------|
| Global Lerp/Damp Utilities | DONE | `src/lib/perf.ts` |
| GPU Acceleration CSS Classes | DONE | `game-canvas`, `game-tile`, `game-button`, `game-panel` |
| State-Lock on Game Finish | DONE | Freeze UI at server result instantly |
| Memory Leak Prevention | DONE | cancelAnimationFrame, clearInterval on unmount |
| 20Hz Tick Rate (Crash) | DONE | 50ms intervals |
| All Assets SVG | DONE | 6 thumbnails, 1.3-2.2KB each |

---

## WHAT'S MISSING FOR BETA

### CRITICAL (Must Have)

| # | Feature | Priority | Effort | Notes |
|---|---------|----------|--------|-------|
| 1 | **Real Payment Gateway** | P0 | HIGH | Currently test-deposit only. Need Stripe/crypto processor for real deposits/withdrawals |
| 2 | **HTTPS + Domain Deployment** | P0 | MED | Need Vercel/VPS deploy with SSL. Currently localhost only |
| 3 | **Environment Hardening** | P0 | LOW | Lock down `.env.local`, set `NEXTAUTH_SECRET` to strong random, add `NEXTAUTH_URL` for production |
| 4 | **Rate Limiting on Server Actions** | P0 | MED | No rate limiting on game bets, login, register, faucet — vulnerable to abuse |
| 5 | **Input Sanitization Audit** | P0 | MED | Validate all user inputs server-side (bet amounts, seeds, etc.) |
| 6 | **Error Boundaries** | P0 | LOW | No React error boundaries — uncaught errors crash the whole page |

### HIGH PRIORITY (Should Have for Beta)

| # | Feature | Priority | Effort | Notes |
|---|---------|----------|--------|-------|
| 7 | **Real 2FA (TOTP)** | P1 | MED | Toggle exists but doesn't generate QR codes or validate OTP |
| 8 | **Real Passkey (WebAuthn)** | P1 | HIGH | Toggle exists but no actual WebAuthn flow |
| 9 | **Email Verification** | P1 | MED | No email verification on sign-up |
| 10 | **Password Reset Flow** | P1 | MED | No "Forgot Password" functionality |
| 11 | **WebSocket/SSE for Real-Time** | P1 | HIGH | Crash game simulates multiplayer locally. Need server-broadcast for real multi-user sync |
| 12 | **Responsible Gaming Enforcement** | P1 | MED | Deposit limits are stored but NOT enforced during actual deposits |
| 13 | **Session Timeout Enforcement** | P1 | LOW | Timeout stored in DB but not actually enforced client-side |
| 14 | **Self-Exclusion Enforcement** | P1 | MED | Flag stored but games don't check it before accepting bets |
| 15 | **Admin Dashboard** | P1 | HIGH | No admin panel for managing users, viewing bets, creating coupons, adjusting balances |
| 16 | **Crash Game — Real Multiplayer** | P1 | HIGH | Currently mock players. Need SSE/WebSocket broadcast of shared round state |
| 17 | **Withdrawal System** | P1 | HIGH | No withdrawal flow exists at all |

### MEDIUM PRIORITY (Nice to Have)

| # | Feature | Priority | Effort | Notes |
|---|---------|----------|--------|-------|
| 18 | **Google/Discord OAuth** | P2 | LOW | NextAuth supports it, just needs provider config |
| 19 | **User Profile Page** | P2 | MED | No public profile page for viewing stats |
| 20 | **Chat System** | P2 | HIGH | No in-game chat |
| 21 | **Notifications System** | P2 | MED | No toast/notification system for wins, promotions |
| 22 | **Mobile PWA Support** | P2 | LOW | Add manifest.json, service worker |
| 23 | **Game Statistics Page** | P2 | MED | Detailed per-game win/loss history, charts |
| 24 | **Referral System** | P2 | MED | Transaction type exists ("REFERRAL") but no referral flow |
| 25 | **VIP Tier Logic** | P2 | MED | VIP level field exists but no actual tier progression logic |
| 26 | **Sound Effects** | P2 | LOW | No audio feedback on wins, bets, crashes |
| 27 | **Provably Fair Verification Page** | P2 | MED | Seeds are shown but no standalone verification tool |
| 28 | **Live Casino — Actual Integration** | P2 | HIGH | Currently mock data. Need real provider API (Evolution, Pragmatic, etc.) |
| 29 | **Terms of Service / Privacy Policy** | P2 | LOW | No legal pages |
| 30 | **Loading Skeletons** | P2 | LOW | Some pages flash on load, need skeleton states |

---

## DATABASE COLLECTIONS

| Collection | Model | Records Created By |
|------------|-------|--------------------|
| `users` | User | Registration, OAuth |
| `bets` | Bet | Every game play |
| `transactions` | Transaction | Every balance change |
| `game_history` | GameRound | Crash rounds |
| `coupons` | Coupon | Admin (manual DB insert for now) |
| `accounts` | NextAuth | NextAuth adapter |
| `sessions` | NextAuth | NextAuth adapter |

---

## FILE INVENTORY

```
src/
├── actions/          3 server action files (deposit, faucet, promos)
├── app/
│   ├── api/          3 API routes (auth, register, live-tables)
│   ├── dashboard/
│   │   ├── originals/  5 game routes + hub page
│   │   ├── live/       1 page
│   │   ├── promotions/ 1 page
│   │   └── settings/   1 page + client component + actions
│   ├── login/        1 page
│   ├── register/     1 page
│   └── @modal/       intercepting route for login
├── components/       23 components (core, auth, landing, live)
├── lib/              8 utilities (auth, db, fairness, currency, perf, game-engine)
├── models/           5 Mongoose models
└── stores/           6 Zustand stores

public/images/games/  6 SVG thumbnails (1-2KB each)
```

---

## QUICK START (Dev)

```bash
npm install
# Set up .env.local with MONGODB_URI, NEXTAUTH_SECRET
npm run dev
# Open http://localhost:3000
```

---

## BETA LAUNCH CHECKLIST

- [ ] Deploy to Vercel or VPS with custom domain + SSL
- [ ] Set production environment variables
- [ ] Add rate limiting (upstash/ratelimit or similar)
- [ ] Add React error boundaries around game routes
- [ ] Enforce deposit limits in test-deposit action
- [ ] Enforce self-exclusion check before all game server actions
- [ ] Add basic admin route for coupon creation
- [ ] Test all 5 games end-to-end with real accounts
- [ ] Test daily faucet cooldown
- [ ] Test promo code redemption
- [ ] Verify balance consistency after multi-game sessions
- [ ] Mobile responsiveness check across all pages
- [ ] Add Terms of Service page (even placeholder)
- [ ] Set up MongoDB Atlas indexes for production performance
