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

## SEO Implementation

### Technical SEO
- **SEO Helper**: `server/seo.ts` provides centralized meta tag generation
- **robots.txt**: Blocks `/admin`, `/panel`, `/panel-adnexus-9f3x`, `/api` from crawlers
- **XML Sitemap**: Dynamic `/sitemap.xml` endpoint includes only public pages
- **Canonical URL**: `https://adnexus.app` used throughout

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- X-Robots-Tag: noindex, nofollow (for private routes)

### JSON-LD Structured Data
- WebSite schema with search action
- Organization schema
- SoftwareApplication schema

### Private Route Protection
- `/admin`, `/panel`, `/panel-adnexus-9f3x` return 404 (not 403 or redirects)
- API admin routes (`/api/admin/*`) also return 404 for unauthorized access
- Never indexed by search engines

## Railway Deployment (Recommended)

### Build & Start Commands
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### Environment Variables Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon/Railway) |
| `SESSION_SECRET` | Session encryption key (generate secure random string) |
| `NODE_ENV` | Set to `production` |
| `PORT` | Auto-set by Railway |
| `FRONTEND_URL` | Your Railway domain (e.g., `https://adunlock-hub-production.up.railway.app`) |

### Session Configuration for Railway
- Uses `trust proxy: 1` for Railway's reverse proxy
- Cookies: `secure: true`, `sameSite: none`, `httpOnly: true`
- Sessions explicitly saved before response to prevent race conditions
- PostgreSQL session store via connect-pg-simple

### Key Files
- **server/index.ts**: Main Express server with CORS and session config
- **tsconfig.server.json**: TypeScript config for server compilation
- **dist/server/server/index.js**: Compiled production entry point

## Vercel Deployment (Legacy)

### Configuration Files
- **vercel.json**: Serverless routing configuration
- **api/index.ts**: Main Express app serverless entry point
- **api/sitemap.ts**: Dedicated sitemap serverless function

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: Set to "production" for Vercel

### Build Commands
- `npm run build`: Standard Vite build
- `npm run build:vercel`: Production build for Vercel deployment