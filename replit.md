# Trading Journal Application

## Overview
This is a Next.js 16 trading journal application that allows users to track their trades, analyze performance, and maintain a trading notebook. The application uses MongoDB for data storage, AWS S3 for image uploads, and Google OAuth for authentication.

**Current State:** UI Redesign Complete - Premium Neutral Dashboard Aesthetic
**Last Updated:** December 5, 2025

## UI Redesign (Completed)
The application features a complete UI redesign inspired by Notion, Linear, and Stripe aesthetics.

### Design System - Brand Colors
**Primary Palette:**
- Primary: #2563EB (blue) - Main brand color for buttons, links, accents
- Dark: #1D4ED8 - Hover states, emphasized elements
- Light: #60A5FA - Secondary accents, chart elements
- Soft: #EFF6FF - Light mode backgrounds

**Accent Colors:**
- Profit (Green): #22C55E - Positive P&L, wins, success states
- Loss (Red): #EF4444 - Negative P&L, losses, error states
- Warning (Yellow): #FACC15 - Alerts, warnings

**Dark Theme Backgrounds (Neutral Black Palette - No Purple/Blue Tints):**
- #0a0a0a - Main page background
- #0f0f0f - Sidebar containers
- #141414 - Card surfaces, main content areas
- #1a1a1a - Elevated surfaces, inputs, dropdowns
- #1e1e1e - Interactive elements base state
- #252525 - Hover states
- #262626 - Borders throughout
- #2a2a2a - Active/pressed states

**Light Theme Backgrounds:**
- White (#ffffff) - Main surfaces, cards
- Gray-50 (#f9fafb) - Background areas
- Gray-100 (#f3f4f6) - Input backgrounds, secondary surfaces
- Gray-200 (#e5e7eb) - Borders, dividers

### Design Tokens
- **Color Mode:** Dark theme (default) with light theme support
- **Typography:** Clean, modern fonts with consistent sizing
- **Borders:** Subtle borders with `border-border` class
- **Cards:** Clean card components with consistent padding and rounded corners

### Redesigned Pages
1. **Sidebar Navigation** - Modern collapsible sidebar with clean icons and hover effects
2. **Root Layout** - New header with accounts dropdown, date range selector, and theme toggle
3. **Dashboard Page** - Stat cards, charts, calendar, and trades widget with new styling
4. **Daily Journal Page** - Filter toolbar, calendar sidebar, quick stats with modern design
5. **Settings Page** - Completely revamped with minimal, modern design inspired by Notion/Linear. Features flattened component hierarchy, clean card-based sections, off-canvas mobile navigation, and dual-theme support. All 6 settings sections (Profile, Security, Subscription, Accounts, Commissions & Fees, Global Settings) use simplified markup with proper overflow handling.
6. **Reports Page** - Fully redesigned with modern tab navigation (Performance, Overview, Reports, Compare, Calendar), theme-aware chart cards with icons and legends, Summary/Days/Trades stat grid with modern pill-style tabs, and dynamic CSS variable-based chart colors
7. **Notebook Page** - Fully redesigned with modern three-column layout (Folders, Notes, Content), responsive mobile navigation, rich text editor with formatting toolbar, clean empty states, and context menus for rename/delete operations
8. **Strategies Page** - Fully redesigned with modern tab navigation (Strategies, Overview, Reports, Compare), theme-aware chart cards using CSS variable-based colors, modern stat grids with icons, strategy comparison charts, and clean empty states. All components use semantic theme tokens exclusively with no hardcoded colors.

### UI Component Library
Located in `src/components/ui/`:
- `button.tsx` - Primary, secondary, ghost, and outline button variants
- `badge.tsx` - Status badges with color variants
- `input.tsx` - Form inputs with proper styling
- `select.tsx` - Dropdown selects
- `stat-card.tsx` - Dashboard stat cards
- `table.tsx` - Modern data tables
- `modal.tsx` - Dialog modals
- `tabs.tsx` - Tab navigation

### CSS Configuration
- Using Tailwind CSS v4 with CSS variables for theming
- Theme variables defined in `src/app/globals.css`
- Avoiding nested @apply directives for compatibility

## Tech Stack
- **Frontend:** Next.js 16.0.1 with React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB (dual database setup - main and accounts)
- **Authentication:** Google OAuth, JWT-based sessions
- **Storage:** AWS S3 for image uploads
- **Email:** Nodemailer with Gmail
- **UI Components:** Material-UI, Framer Motion, Chart.js, Recharts

## Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── (root)/            # Protected routes (dashboard, journal, reports, etc.)
│   ├── api/               # API route handlers
│   ├── auth/              # Authentication pages
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/            # React components
├── lib/                   # Utilities and API handlers
│   ├── api-handlers/     # Business logic for API routes
│   └── db/               # Database connection utilities
├── models/               # Mongoose schemas
│   ├── accounts/         # Account-related models
│   └── main/             # Main database models
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## Environment Configuration

### Required Secrets (Already Configured)
- `DATABASE` - MongoDB connection URI for main database
- `DATABASE2` - MongoDB connection URI for accounts database
- `SECRET_KEY` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GMAIL` - Gmail address for sending emails
- `GMAILPOS` - Gmail app password
- `MAIL` - From email address
- `PHOTO_BUCKET_NAME` - AWS S3 bucket name
- `PHOTO_BUCKET_REGION` - AWS region
- `PHOTO_ACCESS_KEY` - AWS access key
- `PHOTO_SECRET_ACCESS_KEY` - AWS secret key

## Development Setup

### Running the Application
The application runs on port 5000 and binds to 0.0.0.0 to work with Replit's proxy environment.

**Workflow:** Next.js Development Server
- Command: `npm run dev`
- Port: 5000
- Access via the Replit webview

### Key Configurations
1. **Next.js Config:** Configured with `allowedDevOrigins` to allow Replit proxy requests
2. **Package.json:** Dev script configured to bind to 0.0.0.0:5000
3. **TypeScript:** Build errors are ignored (temporary setting from original config)

## Deployment Configuration
- **Type:** Autoscale (serverless)
- **Build:** `npm run build`
- **Run:** `npm run start`
- **Port:** 5000

## Key Features
1. **Dashboard** - Trading performance overview with charts
2. **Daily Journal** - Daily trading notes and reflections
3. **Notebook** - General trading notes and strategies
4. **Reports** - Performance analytics and comparisons
5. **Strategies** - Strategy tracking and analysis
6. **Settings** - User profile and preferences

## Notes
- The application uses TypeScript with strict mode enabled
- Build errors are currently ignored (see next.config.ts)
- Uses dual MongoDB connections for separating main data and account data
- Image uploads are stored in AWS S3
- Authentication supports both traditional email/password and Google OAuth
