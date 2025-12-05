# Trading Journal Application

## Overview
This is a Next.js 16 trading journal application that allows users to track their trades, analyze performance, and maintain a trading notebook. The application uses MongoDB for data storage, AWS S3 for image uploads, and Google OAuth for authentication.

**Current State:** Fully configured and running in Replit environment
**Last Updated:** December 5, 2025

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
