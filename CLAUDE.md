# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ABCLive is an internal gig-planning tool for ABC Studio (a live sound company in Etne, Norway). It manages assignments (gigs), technician personnel, equipment inventory, calendar visibility, superadmin user management, in-app notifications, and gig comments. Gigs can be single events or multi-day festivals with a program schedule, per-item staffing, and optional password-protected public reports.

## Agent Workflow

- Start with [`AGENTS.md`](AGENTS.md) for the repo entry point and specialist router.
- Use [`AGENT_PLAYBOOK.md`](AGENT_PLAYBOOK.md) for ownership, handoffs, escalation, and verification rules.
- Reusable specialist prompts/specs live in [`agents/`](agents).
- Claude Code subagent definitions live in [`.claude/agents/`](.claude/agents) — one file per specialist, invokable via the `/agents` dialog.

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
- `app/actions/` — server actions (e.g. `notifications.ts`)

**Auth pattern:** `proxy.ts` redirects unauthenticated users away from `/dashboard/*` to `/login`, and logged-in users away from `/login` to `/dashboard/gigs`. Server components use `lib/supabase/server.ts`; client components use `lib/supabase/client.ts`; service-role work uses `lib/supabase/admin.ts`.

**Role system:** `profiles.role` stores `admin` and `technician`. `profiles.is_superadmin` controls access to in-app user management. RLS policies in Supabase enforce data access, while server pages and actions re-check permissions and redirect when unauthorized.

**Data model:**
- `profiles` — extends `auth.users`, holds role, primary role, contact info, avatar, and superadmin flag
- `gigs` — assignments with `start_date`/`end_date`, `venue`, `client`, `status`, pricing, `gig_type` (`single` | `festival`), and optional public report fields (`public_report_enabled`, `public_report_slug`, `public_report_password_hash`)
- `equipment` — inventory items with total `quantity`
- `gig_personnel` — join: which technicians are on which gig
- `gig_equipment` — join: which equipment, and how many units, are on which gig
- `gig_files` — file metadata for gig attachments stored in Supabase Storage
- `gig_program_items` — sub-events within a festival gig (name, venue, start/end time)
- `gig_program_item_personnel` — join: technicians assigned to a program item
- `gig_program_item_equipment` — join: equipment assigned to a program item
- `gig_comments` — flat-threaded comments on a gig; `parent_id`/`root_id` support one level of replies
- `notifications` — in-app notifications with types `gig_added` and `comment_mention`; polled every 30 s via `NotificationBell`

**Availability conflict detection:**
- Personnel: `AddPersonnelDialog` queries `gig_personnel` joined to `gigs` for date-overlapping assignments and shows a warning if a technician is already booked
- Equipment: `AddEquipmentDialog` sums `quantity_needed` across overlapping gigs and compares to total `equipment.quantity` to show available units

**TypeScript types:** Manually maintained in `types/database.ts`. All Supabase table rows have corresponding `Row`, `Insert`, and `Update` types. Enums: `UserRole`, `GigStatus`, `GigType`, `NotificationType`. Convenience re-exports:

| Type | Description |
|------|-------------|
| `Profile`, `Gig`, `Equipment` | Core row types |
| `GigPersonnel`, `GigEquipment`, `GigFile` | Gig join/attachment rows |
| `GigProgramItem`, `GigProgramItemPersonnel`, `GigProgramItemEquipment` | Festival program rows |
| `GigProgramItemWithDetails` | Program item with joined personnel and equipment |
| `GigWithDetails` | Gig with all joins including program items |
| `GigComment`, `GigCommentWithAuthor`, `CommentThread` | Comment types with author join and reply threading |
| `Notification`, `NotificationWithContext` | Notification with joined actor and gig |

## Key files

| File | Purpose |
|------|---------|
| `proxy.ts` | Auth route protection and Supabase cookie refresh |
| `lib/supabase/server.ts` | SSR Supabase client for Server Components |
| `lib/supabase/client.ts` | Browser Supabase client for Client Components |
| `lib/supabase/admin.ts` | Service-role Supabase client for server-only admin work |
| `types/database.ts` | All TypeScript types for Supabase tables |
| `app/actions/notifications.ts` | Server actions for notification creation and marking read |
| `supabase/migrations/001_initial_schema.sql` | Base DB schema + RLS policies |
| `supabase/migrations/007_superadmin.sql` | Superadmin support and policy additions |
| `supabase/migrations/008_festival_program_items.sql` | Festival gig type + program item tables |
| `supabase/migrations/009_public_festival_reports.sql` | Public report slug + password hash on gigs |
| `supabase/migrations/010_complete_past_gigs_cron.sql` | Cron job to auto-complete past gigs |
| `supabase/migrations/011_gig_comments.sql` | Flat-threaded gig comments table |
| `supabase/migrations/012_notifications.sql` | In-app notification table + indexes |
| `components/gigs/AddPersonnelDialog.tsx` | Personnel picker with conflict detection |
| `components/gigs/AddEquipmentDialog.tsx` | Equipment picker with availability checks |
| `components/gigs/GigFilesSection.tsx` | Gig attachment upload/download/delete UI |
| `components/gigs/GigCommentsSection.tsx` | Flat-threaded comment UI for gig detail page |
| `components/gigs/FestivalReportView.tsx` | Read view for festival report (public and internal) |
| `components/gigs/FestivalReportSharingPanel.tsx` | Admin panel to enable/configure public report link |
| `components/gigs/ProgramItemDialog.tsx` | Create/edit dialog for festival program items |
| `app/dashboard/gigs/[id]/report/page.tsx` | Public-facing (or internal) festival report page |
| `app/dashboard/gigs/_lib/festival-report.ts` | Data-fetching helpers for festival report |
| `app/dashboard/gigs/_lib/festival-report-pdf.tsx` | PDF export layout for festival report |
| `components/NotificationBell.tsx` | Bell icon in layout; polls for unread notifications every 30 s |
