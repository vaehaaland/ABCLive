# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ABCLive is an internal gig-planning tool for ABC Studio (a live sound company in Etne, Norway). It manages assignments (gigs), technician personnel, equipment inventory, calendar visibility, and superadmin user management.

## Agent Workflow

- Start with [`AGENTS.md`](AGENTS.md) for the repo entry point and specialist router.
- Use [`AGENT_PLAYBOOK.md`](AGENT_PLAYBOOK.md) for ownership, handoffs, escalation, and verification rules.
- Reusable specialist prompts/specs live in [`agents/`](agents).

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

## Environment setup

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run the SQL migrations in [`supabase/migrations`](supabase/migrations) via the Supabase SQL Editor to set up the schema, storage notes, and policy changes.

## Architecture

**Framework:** Next.js 16 App Router (TypeScript) with Supabase for auth + database (PostgreSQL).

**Routing shape:**
- `app/(auth)/` — unauthenticated pages such as login
- `app/dashboard/` — protected pages rendered inside `app/dashboard/layout.tsx`

**Auth pattern:** `proxy.ts` redirects unauthenticated users away from `/dashboard/*` to `/login`, and logged-in users away from `/login` to `/dashboard/gigs`. Server components use `lib/supabase/server.ts`; client components use `lib/supabase/client.ts`; service-role work uses `lib/supabase/admin.ts`.

**Role system:** `profiles.role` stores `admin` and `technician`. `profiles.is_superadmin` controls access to in-app user management. RLS policies in Supabase enforce data access, while server pages and actions re-check permissions and redirect when unauthorized.

**Data model:**
- `profiles` — extends `auth.users`, holds role, primary role, contact info, avatar, and superadmin flag
- `gigs` — assignments with `start_date`/`end_date`, `venue`, `client`, `status`, and pricing
- `equipment` — inventory items with total `quantity`
- `gig_personnel` — join: which technicians are on which gig
- `gig_equipment` — join: which equipment, and how many units, are on which gig
- `gig_files` — file metadata for gig attachments stored in Supabase Storage

**Availability conflict detection:**
- Personnel: `AddPersonnelDialog` queries `gig_personnel` joined to `gigs` for date-overlapping assignments and shows a warning if a technician is already booked
- Equipment: `AddEquipmentDialog` sums `quantity_needed` across overlapping gigs and compares to total `equipment.quantity` to show available units

**TypeScript types:** Manually maintained in `types/database.ts`. All Supabase table rows have corresponding `Row`, `Insert`, and `Update` types. Convenience re-exports include `Profile`, `Gig`, `Equipment`, `GigPersonnel`, `GigEquipment`, `GigFile`, and `GigWithDetails`.

## Key files

| File | Purpose |
|------|---------|
| `proxy.ts` | Auth route protection and Supabase cookie refresh |
| `lib/supabase/server.ts` | SSR Supabase client for Server Components |
| `lib/supabase/client.ts` | Browser Supabase client for Client Components |
| `lib/supabase/admin.ts` | Service-role Supabase client for server-only admin work |
| `types/database.ts` | All TypeScript types for Supabase tables |
| `supabase/migrations/001_initial_schema.sql` | Base DB schema + RLS policies |
| `supabase/migrations/007_superadmin.sql` | Superadmin support and policy additions |
| `components/gigs/AddPersonnelDialog.tsx` | Personnel picker with conflict detection |
| `components/gigs/AddEquipmentDialog.tsx` | Equipment picker with availability checks |
| `components/gigs/GigFilesSection.tsx` | Gig attachment upload/download/delete UI |
