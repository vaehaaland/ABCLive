# ABCLive

ABCLive is ABC Studio's internal planning tool for live sound assignments. It keeps gigs, festival programs, staffing, equipment, attachments, comments, notifications, public festival reports, and superadmin user management in one Supabase-backed Next.js app.

Current version: **1.1.0**

## App State

ABCLive currently supports:

- Authenticated dashboard access with Supabase Auth and route protection.
- Gig planning for single-day assignments and multi-day festivals.
- Festival program items with per-item personnel and equipment assignments.
- Personnel and equipment availability warnings across overlapping gigs.
- Gig attachments through Supabase Storage metadata.
- Flat-threaded gig comments and mention-driven in-app notifications.
- Public, password-protected festival reports with PDF-oriented report views.
- Superadmin user management for roles and user operations.
- Automatic completion support for past gigs through Supabase migration setup.

## Stack

- Next.js 16 App Router with React 19 and TypeScript.
- Supabase for auth, PostgreSQL data, RLS policies, and storage integration.
- Tailwind CSS 4 with shared UI components.
- Vitest, Testing Library, ESLint, and Playwright tooling.

This repo uses a newer Next.js version with breaking changes from older conventions. Before changing Next.js routes, APIs, or framework-specific behavior, read the relevant guide in `node_modules/next/dist/docs/`.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the local environment template:

```bash
cp .env.local.example .env.local
```

Fill in the Supabase values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run the SQL migrations in `supabase/migrations` through the Supabase SQL Editor before using the app against a fresh project.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev       # Start the local Next.js dev server
npm run build     # Build for production
npm run start     # Start the production server after build
npm run lint      # Run ESLint
npm run test      # Run Vitest in watch mode
npm run test:run  # Run Vitest once
```

## Important Project Files

- [`app/(auth)/`](app/(auth)) - unauthenticated routes such as login.
- [`app/dashboard/`](app/dashboard) - protected dashboard routes.
- [`app/actions/`](app/actions) - server actions.
- [`components/gigs/`](components/gigs) - gig, staffing, equipment, comments, files, and report UI.
- [`lib/supabase/`](lib/supabase) - browser, server, and admin Supabase clients.
- [`supabase/migrations/`](supabase/migrations) - database schema, policies, storage notes, and cron setup.
- [`types/database.ts`](types/database.ts) - manually maintained Supabase table and enum types.

## Agent Workflow

- Start with [`AGENTS.md`](AGENTS.md) for the repo entry point and specialist router.
- Use [`AGENT_PLAYBOOK.md`](AGENT_PLAYBOOK.md) for ownership rules, handoffs, escalation, and verification.
- Reusable specialist prompts/specs live in [`agents/`](agents).

## Additional Context

- Architecture and repo-specific implementation notes: [`CLAUDE.md`](CLAUDE.md)
- Design language and UI principles: [`DESIGN.md`](DESIGN.md)

## License

Proprietary. See [`LICENSE`](LICENSE).
