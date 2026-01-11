# ProJournX - Trading Journal Application

## Overview
ProJournX is a Next.js 16 trading journal application designed to help users track trades, analyze performance, and maintain a trading notebook. Its core purpose is to provide a comprehensive tool for traders to monitor and improve their strategies, featuring a premium dashboard, a "Prop Firm Mode" for challenge tracking, and AI-powered pattern detection to build a "playbook" of profitable setups. The project aims to offer a robust and insightful platform for traders.

## User Preferences
- I prefer simple, direct language.
- I like an iterative development approach.
- Ask before making major architectural changes or introducing new libraries.
- Do not make changes to the `src/components/playbook/` folder without explicit instruction.
- Do not make changes to the `src/components/prop-firm/` folder without explicit instruction.

## System Architecture
The application is built on Next.js 16 with React 19 and Tailwind CSS, utilizing Next.js API Routes for backend functionalities.

### UI/UX Decisions
The UI features a premium neutral dashboard aesthetic, drawing inspiration from Notion, Linear, and Stripe. It uses a primary blue palette, with green/red for P&L, and neutral blacks for dark mode. A custom UI component library resides in `src/components/ui/`. Key pages, including Dashboard, Daily Journal, Notebook, Settings, and authentication, incorporate modern design elements such as glassmorphic effects, gradient accents, and micro-animations with Framer Motion.

**Settings Page (Redesigned Jan 2026):**
- Two-panel layout with sticky sidebar navigation on desktop, horizontal pills on mobile
- Lucide icons throughout (migrated from FontAwesome)
- All sections use `cn()` utility and color tokens (text-foreground, bg-card, border-border)
- Sections: Profile (gradient avatar with hover overlay), Security (password strength meter), Preferences (visual theme cards), Accounts (status badges and type indicators), Subscription (pricing card style), Danger Zone (animated warning card)
- Theme persistence with useLayoutEffect to eliminate hydration flash
- Custom 'theme-change' event for cross-component synchronization

### Technical Implementations
- **Frontend:** Next.js 16.0.1, React 19, Tailwind CSS v4.
- **Backend:** Next.js API Routes.
- **State Management:** Zustand for client-side state.
- **Theming:** Tailwind CSS with CSS variables.
- **Currency Conversion:** Multi-currency support (USD/INR) with a fixed exchange rate (83.5 INR = 1 USD).
- **Market Hours Warning:** ManualTradeForm provides warnings for stock/forex trades on weekends.
- **Default Strategy:** Users can set a default strategy from the /strategies page. New manual trades automatically inherit this default strategy. Strategies marked as default display a "Default" badge on their card.
- **Playbook:** AI-powered, rule-based pattern detection analyzes trades across strategy, symbol, time, and day, providing near-miss patterns and diagnostics.
- **Prop Firm Mode:** Supports tracking up to 4 simultaneous prop firm challenges with per-challenge isolation, a portfolio overview, 9+ major prop firm presets, multi-phase tracking, smart alerts for drawdown limits, a scale-up calculator, and a violations timeline. It also includes auto-phase advancement with celebratory notifications.
- **AI Analysis:** Features include a Time Insights Heatmap, Trade Quality Auto-Scorer (based on R-multiple, plan adherence, execution), and a Tilt Risk Gauge to detect losing streaks and overtrading.
- **Dashboard Smart Alerts:** Provides real-time warnings for tilt, low-performance hours, and overtrading.
- **Backtesting Module:** A full-screen TradingView-powered chart for historical market simulation, offering replay controls, trade placement, real-time P&L, and session analytics with persistent chart layouts.
- **Subscription System:** Integrates Razorpay with a manual opt-in 3-day free trial. Access to pro features is gated, and trial status is managed via backend and client-side flags. Admin users bypass all subscription checks.
- **Coupon System:** Supports coupon codes at checkout, linked to Razorpay Offers for actual discounts.
- **User Referral System:** Each user receives a unique referral code, enabling tracking of referred sign-ups.
- **Verified P&L / Public Profile (Jan 2026):** Influencers can share authenticated trading performance with their audience. Features include:
  - Public profile page at `/profile/[username]` displaying trader stats, equity curve, and monthly P&L
  - Verification badge: "Verified" (green shield) for accounts with broker sync (MT5), "Unverified" for manual-only accounts
  - Privacy controls in Settings > Public Profile to toggle visibility of stats (equity curve, win rate, profit factor, P&L, etc.)
  - Custom username support for vanity URLs
  - Shareable link generator with copy-to-clipboard functionality
  - Dollar amounts can be hidden to show relative performance only

### System Design Choices
- **Project Structure:** Clear separation of concerns with dedicated directories for routes, components, utilities, database models, state management, and type definitions.
- **Environment Configuration:** Pre-configured environment variables for Replit.
- **Development & Deployment:** Configured for Replit, running on port 5000, with autoscale deployment.

## External Dependencies
- **Database:** MongoDB (for user data, backtest sessions, and trading accounts).
- **Authentication:** Google OAuth, JWT-based sessions.
- **Storage:** AWS S3 for image uploads.
- **Email:** Resend (professional email delivery with automatic contact syncing to Resend Audiences including subscription metadata for targeted campaigns by trial status, subscription status, and trial expiry dates).
- **UI Libraries:** Material-UI, Framer Motion, Chart.js, Recharts.
- **Market Data:** Polygon.io API (exclusive for FOREX chart data).
- **Payment Gateway:** Razorpay.
- **WhatsApp Support:** Click-to-chat button on Support page linking to support number +919000248120.