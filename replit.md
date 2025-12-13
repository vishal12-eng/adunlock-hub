# ADNEXUS - Content Locker Platform

## Overview

ADNEXUS is a content locker web application that allows users to unlock premium content (files, downloads, redirects) by watching a required number of advertisements. The platform includes a public-facing content gallery, an unlock flow with ad tracking, and a full admin dashboard for content and settings management.

## Admin Access

- **Secret Admin URL**: `/panel-adnexus-9f3x/login`
- **Admin Email**: adnexus64@gmail.com
- **Admin Password**: Adnexus@64
- Admin button is hidden from the public frontend
- Unauthorized access returns 404 (not 403) for security
- Role-based access control via `user_roles` table

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Routing**: React Router DOM for client-side navigation
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with CSS variables for theming, custom dark neon theme
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Font**: Plus Jakarta Sans loaded via Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript executed via tsx
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Session Management**: Express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Custom session-based admin auth with bcrypt password hashing
- **Development Mode**: Vite dev server middleware integration for HMR

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Tables**:
  - `contents` - Lockable content items with titles, URLs, ad requirements, and stats
  - `user_sessions` - Tracks ad watch progress per visitor per content
  - `site_settings` - Key-value store for configuration (e.g., ad network URLs)
  - `admin_users` - Admin accounts with hashed passwords
  - `session` - Express session storage (auto-created)

### Key Design Patterns
- **Shared Types**: Schema defined once in `shared/schema.ts`, used by both frontend and backend via path aliases
- **Storage Interface**: `IStorage` interface abstracts database operations for testability
- **Session-based Tracking**: Anonymous users tracked via localStorage session ID for ad progress
- **API Client**: Centralized `src/lib/api.ts` handles all fetch requests with credentials

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable

### Ad Network Integration
- **Adsterra Smartlink**: Configurable via admin settings panel, stored in `site_settings` table

### Authentication
- **Session Secret**: Configured via `SESSION_SECRET` environment variable (falls back to default in dev)

### Build & Development
- **Lovable**: Project originated from Lovable platform with component tagging in development
- **Drizzle Kit**: Database schema push via `npm run db:push`, studio via `npm run db:studio`