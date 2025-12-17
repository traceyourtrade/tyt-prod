# Trading Journal Application

## Overview
This Next.js 16 trading journal application enables users to track trades, analyze performance, and maintain a trading notebook. It features a premium, neutral dashboard aesthetic with a dedicated "Prop Firm Mode" and account type filtering. The application aims to provide a comprehensive tool for traders to monitor and improve their trading strategies, including AI-powered pattern detection to build a "playbook" of profitable setups and detailed tracking for prop firm challenges.

## User Preferences
- I prefer simple, direct language.
- I like an iterative development approach.
- Ask before making major architectural changes or introducing new libraries.
- Do not make changes to the `src/components/playbook/` folder without explicit instruction.
- Do not make changes to the `src/components/prop-firm/` folder without explicit instruction.

## System Architecture
The application is built on Next.js 16 with React 19 and Tailwind CSS. It uses Next.js API Routes for the backend.

### UI/UX Decisions
The UI features a complete redesign inspired by Notion, Linear, and Stripe, adopting a premium neutral dashboard aesthetic.
- **Color Scheme:** A primary blue palette for branding, with specific green/red for profit/loss (#4EBF94 for profit), and a neutral black palette for dark theme backgrounds (default) and a grayscale palette for light theme.
- **Design System:** Utilizes consistent design tokens for color modes, typography, borders, and card components.
- **Page Designs:** Key pages like Dashboard, Daily Journal, Settings, Reports, Notebook, Strategies, Login, and Lot Size Calculator have been redesigned for a modern, clean, and intuitive user experience.
- **Component Library:** A custom UI component library is located in `src/components/ui/` for reusable elements like buttons, badges, inputs, selects, stat cards, tables, modals, and tabs.
- **Sidebar:** Premium redesigned sidebar with glassmorphic effect (backdrop-blur + translucent gradient), profit green (#4EBF94) accents, animated left glow bar for active states, Framer Motion micro-animations, and keyboard-accessible focus states. Features gradient Add Trade CTA button, premium user profile card with avatar glow, and smooth collapse/expand transitions.

### Technical Implementations
- **Frontend:** Next.js 16.0.1, React 19, Tailwind CSS v4.
- **Backend:** Next.js API Routes.
- **State Management:** Zustand for client-side state management.
- **Theming:** Tailwind CSS with CSS variables for theme definition in `src/app/globals.css`.

### Feature Specifications
- **Dashboard:** Performance overview with charts.
- **Daily Journal:** TradeZella-inspired horizontal single-trade focused layout with premium glassmorphic header and gradient accent bar. Features trade selector dropdown with search, 1 of N navigation arrows, and main tab bar (Stats/Strategy/Executions/Attachments). Left collapsible panel shows context-aware content based on active tab: Stats displays comprehensive metrics (Net P&L hero card, Side, Quantity, Pips, Return/Pip, Fees, Swap, Net ROI, Gross P&L, Adjusted Cost, Strategy badge, 5-star Trade Rating, MAE/MFE cards, Profit Target, Stop Loss, R:R metrics, Entry/Exit prices); Strategy shows current strategy with rules compliance checklist and sentiment selector (Great/Okay/Poor); Executions shows entry/exit timeline with duration; Attachments shows screenshot upload/gallery. Center area with Chart/Notes/Running P&L sub-tabs, timeframe selector (5y to D), and TradingView-style toolbar. Notes tab features Trade Note vs Daily Journal toggle, template selector, journal prompts with floating labels, and quick tag pills. Framer Motion micro-animations throughout.
- **Notebook:** Premium three-column layout (collapsible Folders, persistent Files, Content viewer) with glassmorphic header and gradient accent bar. Features comprehensive template system with 5 pre-made templates (Trade Idea, Market Analysis, Weekly Review, Strategy Documentation, Psychology Notes). Template Picker modal with category-based selection and visual previews. ViewMode displays structured template data with sentiment badges, confidence meters, entry/SL/TP cards, and formatted sections. Premium empty states, modern filter/search, and Framer Motion animations throughout.
- **Reports & Strategies:** Redesigned pages with tab navigation, theme-aware charts, and modern stat grids for analytics.
- **Playbook:** AI-powered pattern detection (`src/components/playbook/`) identifies winning trade setups based on historical data (strategy, symbol, time, day patterns). Users can add these to a personal playbook. Requires a minimum of 10 trades for detection.
- **Prop Firm Mode:** A dedicated mode (`src/components/prop-firm/`) with a distinct amber/gold accent color scheme, circular progress gauges, and glassmorphism effects. It tracks challenge progress with profit targets and drawdown limits, including daily drawdown, and offers a "Challenge Command Center" design. Features a mode toggle and account type filtering (Normal vs. Prop Firm accounts).
- **Lot Size Calculator:** A dedicated tool for forex position sizing with pip value calculations, input validation, and risk presets.
- **Resource Center:** A comprehensive trading education hub at `/resources` with three main tabs:
  - **Knowledge Hub:** 8 categorized trading education articles (Technical Analysis, Risk Management, Strategy, Fundamentals) with search, category filtering, expandable content, and read time estimates.
  - **Psychology Corner:** Daily affirmations carousel with auto-rotation, psychology tips grid organized by category (Discipline, Mindset, Emotions, Pitfalls), and common trading pitfalls section.
  - **Routines Tab:** Pre-built checklists (Pre-Market, During Trade, Post-Market), custom routine creation, item editing/deletion, daily automatic reset, streak tracking with farming protection. Uses localStorage for persistence.
- **Account Type System:** A new `isPropFirm` field in user accounts allows filtering accounts based on "Live Trading" or "Prop Firm" modes throughout the application.
- **AI Analysis:** Advanced statistical analysis hub at `/ai-analysis` with 7 modules (no actual AI, uses rule-based statistics):
  - **Streak Analysis:** Win/loss streak tracking, longest/average streaks, post-streak pattern detection (overconfidence warnings)
  - **Risk Analysis:** Max drawdown, daily P&L extremes, position sizing consistency, risk:reward ratio trends
  - **Time Insights:** Best/worst trading hours, session performance (Asian/London/NY), holding time analysis
  - **Emotional Patterns:** Revenge trading detection (trades within 15min of loss), overtrading days, recovery time analysis
  - **Benchmarks:** Monthly P&L comparisons, consistency score, rolling 30-trade performance, profitable months tracking
  - **Trade Quality:** Auto-scoring based on strategy/SL/TP presence, quality vs profitability correlation, improvement tracking
  - **Correlations:** Symbol performance rankings, strategy effectiveness, symbol pair correlations
- **Trade Sharing:** Share individual trades with other users for feedback at `/shared/[token]`:
  - Generate shareable links for any trade with public/private visibility options
  - Privacy controls: hide dollar amounts, hide account size, set link expiration
  - Private sharing restricts access to specific email addresses
  - Comment/feedback system for viewers to provide input on shared trades
  - View count tracking for shared trade links
  - ShareTradeModal component in `src/components/shared/ShareTradeModal.tsx`
- **Leaderboard:** Community rankings at `/leaderboard` with opt-in participation:
  - Four ranking categories: Consistency Score, R-Multiple, Win Rate, Profit Factor
  - Three time periods: This Week, This Month, All Time
  - Opt-in system with privacy controls (anonymous names, display name customization)
  - Rank change indicators showing movement since last update
  - Top 3 positions feature special badges (gold, silver, bronze)
  - User can view their own ranking across all categories
- **Broker Auto-Sync:** Automatic trade import feature in Add Trade modal:
  - Available brokers: MetaTrader 5, Binance, Angel One, Upstox (shown as "Available")
  - Coming soon brokers: MetaTrader 4, TradingView, Zerodha, Interactive Brokers
  - Premium glassmorphic card design with gradient broker logos
  - Features: Auto-sync, Secure API, Real-time status indicators
- **Support Page:** Comprehensive help center at `/support` with:
  - Glassmorphic hero section with gradient orbs matching app design
  - Quick Links grid to Resource Center, AI Analysis, Settings, Lot Calculator
  - Help Topics cards (Getting Started, Analytics, Notebook, Settings) with color-coded icons
  - FAQ section with tab-based categories and expandable accordion
  - Contact Form with email submission to support team (sends confirmation to user)
  - API endpoint at `/api/support/contact` for form processing
- **Backtesting Module:** Comprehensive backtesting system at `/backtesting/dashboard` with historical market simulation:
  - **Dashboard:** Premium UI with hero stat cards (Time Invested, Historical Days, Total Trades, Win Rate, Total P&L), session management with filter tabs (All/Active/Completed), search, and sorting
  - **Chart Workspace:** Full-screen TradingView-powered chart at `/backtesting/[sessionId]` with replay controls, trade placement, and real-time P&L tracking
  - **AstraFlow Design System:** Shared design tokens in `globals.css` under `.dark` with `--af-*` prefix. Dashboard uses `.af-*` utility classes and CSS variable references; chart workspace uses `.bt-*` classes (aliased to shared tokens) in `backtesting.css`
  - **Color Psychology:** Deep Charcoal (#08090b to #181b23) for reduced eye strain, Electric Blue (#3b82f6) for trust/focus, Teal (#14b8a6) for growth indicators
  - **Session Features:** Symbol/date range configuration, balance tracking, Twelve Data API for historical candles
  - **Chart Persistence:** Auto-saves and restores TradingView drawings, indicators, and chart state per session. Uses MongoDB to store chart layouts, study templates, and drawing templates. Auto-save triggers on drawing events, indicator changes, and interval changes. Saves before leaving and restores when returning to a session.
  - **Database:** Uses DATABASE3 secret for MongoDB backtesting data storage
  - **Session Analytics:** Comprehensive analytics suite at `/backtesting/sessions` with 10 visualization modules:
    - **Profit and Loss Chart:** Cumulative equity curve area chart with All/Day time toggle, stats row (Total PnL, Account Balance, Win Rate, Total Trades, Breakeven Trades, Threshold input)
    - **R:R Metrics Cards:** Average RR, Max RR, Ideal Average RR, Max Ideal RR, Could have profit/BE count with mini sparkline charts
    - **Winners & Losers:** Side-by-side cards showing total, best/worst %, average %, duration, max/avg consecutive streaks
    - **Performance by Side:** Dual donut charts for Total Trades and Win Rate by Buy/Sell side
    - **Performance by Session:** 4 radar/spider charts for Win Rate, Total Trades, Avg RR, Profit by trading session (Asia/London/New York based on UTC hours)
    - **Performance by Time:** Bar chart by hour with metric dropdown (P&L, Win Rate, Trades, R:R)
    - **Performance by Day:** Horizontal bar chart by weekday with win rate badges
    - **Performance by Month:** Monthly grid with accumulated/overall gain toggles, initial/current balance modes, YTD and total calculations
    - **Performance Calendar:** Full calendar view with P&L and trade count per day, month/year navigation, dollar/percent display modes
    - **Trade Frequency:** 3 bar charts for trades/day, trades/week, trades/month with average reference lines
    - **Data Layer:** `useBacktestAnalytics` hook (`src/hooks/backtesting/useBacktestAnalytics.ts`) computes all statistics from session trades
    - **Components:** All in `src/components/backtesting/analytics/` using AstraFlow design tokens

### System Design Choices
- **Project Structure:** Clear separation of concerns with dedicated directories for app routes, components, utilities (`lib`, `utils`), database models, state management (`store`), and type definitions.
- **Environment Configuration:** All necessary environment variables are pre-configured.
- **Development & Deployment:** Configured for Replit's environment, running on port 5000, with specific Next.js and `package.json` configurations. Uses autoscale for deployment.

## External Dependencies
- **Database:** MongoDB (dual database setup for main and accounts data).
- **Authentication:** Google OAuth, JWT-based sessions.
- **Storage:** AWS S3 for image uploads.
- **Email:** Nodemailer with Gmail.
- **UI Libraries:** Material-UI, Framer Motion, Chart.js, Recharts.