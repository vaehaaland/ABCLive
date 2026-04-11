# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ABCLive is an internal gig-planning tool for ABC Studio (a live sound company in Etne, Norway). It manages assignments (gigs), technician personnel, and equipment inventory — with availability conflict detection to prevent double-booking.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

## Environment setup

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the SQL migration in [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) via the Supabase SQL Editor to set up the database schema and RLS policies.

## Architecture

**Framework:** Next.js 15 App Router (TypeScript) with Supabase for auth + database (PostgreSQL).

**Route groups:**
- `app/(auth)/` — unauthenticated pages (login)
- `app/(dashboard)/` — protected pages; layout at `app/(dashboard)/layout.tsx` fetches user role and renders the nav

**Auth pattern:** `middleware.ts` redirects unauthenticated users away from `/dashboard/*` to `/login`, and logged-in users away from `/login` to `/dashboard/gigs`. Server components use `lib/supabase/server.ts`; client components use `lib/supabase/client.ts`.

**Role system:** Two roles stored in `profiles.role`: `admin` (full access) and `technician` (read-only own gigs). RLS policies in Supabase enforce this at the database level. Server pages re-check roles and `redirect()` if unauthorized.

**Data model:**
- `profiles` — extends `auth.users`, holds `role` and contact info
- `gigs` — assignments with `start_date`/`end_date`, `venue`, `client`, `status`
- `equipment` — inventory items with total `quantity`
- `gig_personnel` — join: which technicians are on which gig
- `gig_equipment` — join: which equipment (and how many) is on which gig

**Availability conflict detection:**
- Personnel: `AddPersonnelDialog` queries `gig_personnel` joined to `gigs` for date-overlapping assignments and shows a warning if a technician is already booked
- Equipment: `AddEquipmentDialog` sums `quantity_needed` across overlapping gigs and compares to total `equipment.quantity` to show available units

**TypeScript types:** Manually maintained in `types/database.ts`. All Supabase table rows have corresponding `Row`, `Insert`, and `Update` types. Convenience re-exports: `Profile`, `Gig`, `Equipment`, `GigPersonnel`, `GigEquipment`, `GigWithDetails`.

## Key files

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth route protection |
| `lib/supabase/server.ts` | SSR Supabase client (Server Components) |
| `lib/supabase/client.ts` | Browser Supabase client (Client Components) |
| `types/database.ts` | All TypeScript types for Supabase tables |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema + RLS policies |
| `components/gigs/AddPersonnelDialog.tsx` | Personnel picker with conflict detection |
| `components/gigs/AddEquipmentDialog.tsx` | Equipment picker with availability check |
| `app/(dashboard)/gigs/[id]/page.tsx` | Gig detail with personnel + equipment management |
