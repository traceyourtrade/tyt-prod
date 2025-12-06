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
- **Color Scheme:** A primary blue palette for branding, with specific green/red for profit/loss, and a neutral black palette for dark theme backgrounds (default) and a grayscale palette for light theme.
- **Design System:** Utilizes consistent design tokens for color modes, typography, borders, and card components.
- **Page Designs:** Key pages like Dashboard, Daily Journal, Settings, Reports, Notebook, Strategies, Login, and Lot Size Calculator have been redesigned for a modern, clean, and intuitive user experience.
- **Component Library:** A custom UI component library is located in `src/components/ui/` for reusable elements like buttons, badges, inputs, selects, stat cards, tables, modals, and tabs.

### Technical Implementations
- **Frontend:** Next.js 16.0.1, React 19, Tailwind CSS v4.
- **Backend:** Next.js API Routes.
- **State Management:** Zustand for client-side state management.
- **Theming:** Tailwind CSS with CSS variables for theme definition in `src/app/globals.css`.

### Feature Specifications
- **Dashboard:** Performance overview with charts.
- **Daily Journal:** Premium UI with glassmorphism cards, gradient accents, and refined color psychology. Features floating-label inputs with animated transitions, gradient progress bars with ambient glows, pill-style template navigation tabs, premium sentiment selectors, and Framer Motion micro-animations throughout. Trade list sidebar has gradient backgrounds with P&L color-coded badges.
- **Notebook:** Three-column layout for organizing general trading notes and strategies with a rich text editor.
- **Reports & Strategies:** Redesigned pages with tab navigation, theme-aware charts, and modern stat grids for analytics.
- **Playbook:** AI-powered pattern detection (`src/components/playbook/`) identifies winning trade setups based on historical data (strategy, symbol, time, day patterns). Users can add these to a personal playbook. Requires a minimum of 10 trades for detection.
- **Prop Firm Mode:** A dedicated mode (`src/components/prop-firm/`) with a distinct amber/gold accent color scheme, circular progress gauges, and glassmorphism effects. It tracks challenge progress with profit targets and drawdown limits, including daily drawdown, and offers a "Challenge Command Center" design. Features a mode toggle and account type filtering (Normal vs. Prop Firm accounts).
- **Lot Size Calculator:** A dedicated tool for forex position sizing with pip value calculations, input validation, and risk presets.
- **Account Type System:** A new `isPropFirm` field in user accounts allows filtering accounts based on "Live Trading" or "Prop Firm" modes throughout the application.

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