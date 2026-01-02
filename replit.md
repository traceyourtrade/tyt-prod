# ProJournX - Trading Journal Application

## Overview
This Next.js 16 trading journal application helps users track trades, analyze performance, and maintain a trading notebook. It features a premium dashboard, a "Prop Firm Mode" for challenge tracking, and AI-powered pattern detection to build a "playbook" of profitable setups. The goal is to provide a comprehensive tool for traders to monitor and improve their strategies.

## User Preferences
- I prefer simple, direct language.
- I like an iterative development approach.
- Ask before making major architectural changes or introducing new libraries.
- Do not make changes to the `src/components/playbook/` folder without explicit instruction.
- Do not make changes to the `src/components/prop-firm/` folder without explicit instruction.

## System Architecture
The application is built on Next.js 16 with React 19 and Tailwind CSS. It uses Next.js API Routes for the backend.

### UI/UX Decisions
The UI adopts a premium neutral dashboard aesthetic inspired by Notion, Linear, and Stripe, using a primary blue palette, with green/red for P&L, and neutral blacks for dark mode. A custom UI component library is located in `src/components/ui/`. Key pages like Dashboard, Daily Journal, Notebook, and authentication pages have been redesigned for a modern user experience, featuring glassmorphic effects, gradient accents, and micro-animations with Framer Motion. The sidebar is also redesigned with a glassmorphic effect and accent colors.

### Technical Implementations
- **Frontend:** Next.js 16.0.1, React 19, Tailwind CSS v4.
- **Backend:** Next.js API Routes.
- **State Management:** Zustand for client-side state.
- **Theming:** Tailwind CSS with CSS variables.

### Feature Specifications
- **Dashboard:** Performance overview with charts.
- **Daily Journal:** Modern glassmorphic three-pane layout with TradingView chart integration, trade notes, and detailed statistics.
- **Notebook:** Premium three-column layout with a comprehensive template system for various trading analyses and notes.
- **Reports & Strategies:** Redesigned pages with theme-aware charts for analytics.
- **Playbook:** AI-powered (rule-based) pattern detection for identifying winning trade setups. Features include:
  - **Pattern Detection:** Analyzes trades across 4 dimensions (Strategy ≥50% win rate, Symbol/Time/Day ≥55% win rate) with 5+ trades minimum per category.
  - **Near-Miss Patterns:** Shows patterns close to qualifying (3-4 trades) with progress bars and specific requirements.
  - **Trade Distribution Diagnostics:** Displays breakdown of trades by symbol, strategy, day, and time to help users understand why patterns aren't detected.
  - **Intelligent Fallback:** Shows demo data only when <10 total trades; otherwise shows real diagnostics and near-miss patterns.
- **Prop Firm Mode:** Comprehensive prop firm challenge tracking system with amber/gold accents:
  - **Multi-Challenge Support:** Track up to 4 simultaneous prop firm challenges with per-challenge isolation of settings, metrics, violations, and phase progression. Uses `challenges: Record<string, PropChallenge>` with `activeChallengeIds` array and `viewingChallengeId` for selection. Persist migration (version 2) handles legacy single-challenge data conversion.
  - **Portfolio Overview:** Aggregate stats view showing total capital, total P&L, active count, and at-risk challenges count with individual challenge cards.
  - **Presets Library:** 9+ major prop firm presets (FTMO, The Funded Trader, The5ers, MyForexFunds, E8 Funding, Funded Next, Alpha Capital, True Forex Funds, Custom) with accurate rules, phases, and scaling plans.
  - **Multi-Phase Tracking:** Visual phase roadmap showing progression through evaluation phases to funded status.
  - **Challenge History:** Complete history of all challenge attempts with pass/fail status and statistics.
  - **Smart Alerts:** Automatic violation logging at 70% (warning) and 85% (critical) of drawdown limits with deduplication, now per-challenge.
  - **Scale-Up Calculator:** Projects capital growth based on prop firm scaling plans and monthly returns.
  - **Violations Timeline:** Tracks drawdown warnings, breaches, and other rule violations with journal notes per challenge.
  - **Future Enhancement:** Account-to-challenge linking via `linkedAccountIds` for filtering trades per challenge (not yet implemented).
- **Lot Size Calculator:** Tool for forex position sizing.
- **Resource Center:** Educational hub with articles, psychology tips, and customizable trading routines.
- **Account Type System:** `isPropFirm` field for filtering accounts.
- **AI Analysis:** Advanced statistical analysis hub (rule-based) including streak, risk, time, emotional patterns, benchmarks, trade quality, correlations, and smart insights. Enhanced features include:
  - **Time Insights Heatmap:** 24-hour × 7-day performance grid with color-coded win rates (green/amber/red) showing "Your Edge" best/worst times.
  - **Trade Quality Auto-Scorer:** Scores each trade 0-100 based on R-multiple (40pts), plan adherence (30pts), and execution (30pts) with score distribution charts.
  - **Tilt Risk Gauge:** Real-time 0-100 score detecting losing streaks (+20 per loss, max 60), position size increases (+20), and overtrading (+20). Color-coded: Green (0-30), Yellow (31-60), Red (61-100).
  - **Smart Insights Tab:** Personalized trading DNA profile, weekly performance patterns, and actionable tips based on historical data analysis.
- **Dashboard Smart Alerts:** Real-time pattern warning banners showing tilt warnings (3+ consecutive losses), low-performance hour alerts (when trading during historically bad times), and overtrading alerts (2x+ average daily trades). Dismissible per session.
- **Trade Sharing:** Generate shareable links for individual trades with privacy controls and a comment system.
- **Leaderboard:** Community rankings based on trading metrics (opt-in).
- **Broker Auto-Sync:** Feature for automatic trade import from supported brokers.
- **Support Page:** Comprehensive help center with FAQs and a contact form.
- **Backtesting Module:** Full-screen TradingView-powered chart for historical market simulation, with replay controls, trade placement, real-time P&L tracking, and session analytics. It includes persistent chart layouts, drawings, indicators, and a favorites toolbar saved per session. **Technical Note:** Timeframe switches use stable symbols with `setResolution()` + `resetData()` to preserve TradingView's native drawing persistence. The slow path (API fetch) checks `currentIntervalRef` vs closure `currentInterval` after fetch to abort stale data that would overwrite the user's current view during rapid switches. **FX Replay Spec Compliance (Time-Driven Architecture):** `replayTimestampRef` is the ABSOLUTE source of truth for replay position - it NEVER changes during timeframe switches (only when user advances replay). All code paths use `setReplayTimeAndDeriveIndex()` as the canonical setter - replayTime is set first, index is always derived using the formula: a candle is "completed" when `(bar.time + intervalMs) <= replayTime`. This ensures the 12×5m→15m test case works correctly (12 candles on 5m = 60min elapsed → shows exactly 4 completed 15m candles). Scrolling is view-only. `callbacksReadyRef` gates playback controls and is set after the canonical setter completes. **TF Switch Detection:** Uses `widgetInitializedRef.current` (stable flag set once widget exists) to detect TF switch vs first load, avoiding race conditions from rapid switch ref overwrites. **TradingView Cache Invalidation:** Timeframe switches call `resetCache()` before `resetData()` to force TradingView to clear its internal bar cache and re-request data from our datafeed via `getBars`. This ensures proper bar filtering based on `replayTimestampRef` when switching between timeframes.
- **Affiliate Program:** User-facing affiliate dashboard at `/affiliate` where users can join the program, get unique referral links, track referrals, and view commissions. Admin APIs support managing affiliates and creating personalized coupon codes. Uses `ADMIN_API_KEY` for admin endpoint authentication.
- **Announcement Banner:** Global banner component fetching from admin API to display announcements and maintenance mode overlays.
- **Subscription System:** Razorpay integration with **blocking pay-to-use model** (no free trial). Pricing: ₹849/month or ₹8,199/year (20% off). New users are created with `subscriptionStatus: 'inactive'` and are immediately redirected to `/checkout` after signup. Users cannot access app features until payment is complete. The layout checks subscription status and redirects unpaid users to checkout (except for public pages: /checkout, /settings, /support). Admin users (in ADMIN_EMAILS array) bypass all subscription checks. In-app checkout page with monthly/yearly toggle, coupon code input, and Razorpay SDK modal. Webhook handles subscription events (activated, charged, cancelled, halted). Sidebar displays "Pro Member" badge for subscribers or "Go Pro" button for non-subscribers. Uses `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID` (monthly), `RAZORPAY_PLAN_ID_YEARLY` (yearly), `RAZORPAY_WEBHOOK_SECRET` secrets. Pro-only features: Backtesting, Strategies, Playbook, AI Analysis (gated with SubscriptionGate component). **Plan Upgrade:** Monthly subscribers can upgrade to yearly via Settings > Subscription "Upgrade to Yearly" button, which redirects to `/checkout?plan=yearly&upgrade=true`. The `billingPeriod` field in user.subscription tracks current plan type.
- **Coupon System:** Checkout supports coupon codes (WELCOME20, YEARLY50, TRADER10). To enable actual Razorpay discounts, create Offers in Razorpay Dashboard (Subscriptions → Offers) and set corresponding secrets: `RAZORPAY_OFFER_WELCOME20`, `RAZORPAY_OFFER_YEARLY50`, `RAZORPAY_OFFER_TRADER10`. Without these, coupons show UI discounts but Razorpay charges full price.

### System Design Choices
- **Project Structure:** Clear separation of concerns with dedicated directories for routes, components, utilities, database models, state management, and type definitions.
- **Environment Configuration:** Pre-configured environment variables for Replit.
- **Development & Deployment:** Configured for Replit, running on port 5000, with autoscale deployment.

## External Dependencies
- **Database:** MongoDB (main database for user data, accounts database for trading accounts). Backtest session data is now stored in the main database.
- **Authentication:** Google OAuth, JWT-based sessions.
- **Storage:** AWS S3 for image uploads.
- **Email:** Nodemailer with Gmail.
- **UI Libraries:** Material-UI, Framer Motion, Chart.js, Recharts.
- **Market Data:** Polygon.io API (exclusive source for FOREX chart data). No VPS or caching layer - all chart data fetched directly from Polygon.