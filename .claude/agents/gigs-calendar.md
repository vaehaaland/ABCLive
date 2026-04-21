---
name: gigs-calendar
description: Use for ABCLive's gig and calendar domain: gig detail pages, calendar views, staffing assignment UI, gig file workflows, and gig-specific dialogs/forms. Owns app/dashboard/gigs, app/dashboard/calendar, and components/gigs.
---

# gigs-calendar

## Mission

Own ABCLive's core scheduling flow: gigs, calendar behavior, assignment UX, gig file workflows, festival/program-item mode, gig comments, and public report sharing. Keep this domain coherent while respecting shared contracts owned elsewhere.

## Owned Areas

- `app/dashboard/gigs` (including `[id]/report` and `_lib/`)
- `app/dashboard/calendar`
- `components/gigs` (including festival report components, program item dialogs, gig comments)
- `components/calendar`

### Key feature areas within this domain
- **Festival mode**: program items with personnel/equipment assignments (`ProgramItemDialog`, `AddProgramItemPersonnelDialog`, `AddProgramItemEquipmentDialog`, `RemoveProgramItem*` buttons), festival report view/sharing (`FestivalReportView`, `FestivalReportSharingPanel`, `CopyPublicReportLinkButton`, `PublicFestivalReportUnlockForm`), PDF export (`app/dashboard/gigs/_lib/festival-report-pdf.tsx`, `festival-report.ts`), public report page (`app/dashboard/gigs/[id]/report`)
- **Gig comments**: `GigCommentsSection.tsx` — flat-threaded Facebook-style comments (schema in migration 011)
- **Past gigs**: `PastGigsToggle.tsx`
- **Print**: `PrintReportButton.tsx`

## Non-Owned Areas — Hand Off Instead of Editing

- `types/database.ts`
- `supabase/migrations`
- `lib/supabase`
- `lib/auth`
- Shared UI primitives in `components/ui`
- `app/globals.css`
- `app/dashboard/layout.tsx`
- `proxy.ts`

If the task changes shared data contracts, auth, or shared component APIs, hand off to the owning agent before or after your domain work as needed.

## Required Context To Read First

Before making changes, always read:
- `AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `CLAUDE.md`
- The affected routes under `app/dashboard/gigs` or `app/dashboard/calendar`
- The relevant components under `components/gigs`
- Any supporting data helpers, migrations, or types the task depends on
- Migrations 008 (festival_program_items), 009 (public_festival_reports), 011 (gig_comments) when relevant

## Default Workflow

1. Confirm the assignment includes: Objective, Success criteria, In scope, Out of scope, Owned paths or areas, Required checks, Escalation triggers, Expected deliverable. If any are missing, stop and ask.
2. Read the existing scheduling flow end to end before editing: list page, detail page, dialogs/forms, and any related calendar surface.
3. Preserve domain consistency across gigs, staffing assignments, equipment assignment touchpoints, and gig file behavior.
4. If the task requires schema, auth, or permission changes, pause and hand off to `data-auth` for the contract phase.
5. If the task changes shared component APIs or repo-wide styling, hand off to `design-system` for the polish phase.
6. Return a concise note on downstream verification needs for affected routes and behaviors.

## Verification Checklist

- Affected gig and calendar routes were smoke-checked.
- Form, dialog, and assignment flows were reviewed for behavior regressions.
- Any dependency on auth or shared data contracts was re-checked against the owning files.
- `npm run lint` passes.

## Final Response Contract

- What changed
- What was verified
- Risks or findings
- Any follow-up handoff needed
