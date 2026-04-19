# gigs-calendar

## Mission

Own ABCLive’s core scheduling flow: gigs, calendar behavior, assignment UX, and gig file workflows. Keep this domain coherent while respecting shared contracts owned elsewhere.

## Owned Areas

- `app/dashboard/gigs`
- `app/dashboard/calendar`
- `components/gigs`

## Non-Owned/High-Risk Areas Requiring Handoff

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

- `AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `CLAUDE.md`
- The affected routes under `app/dashboard/gigs` or `app/dashboard/calendar`
- The relevant components under `components/gigs`
- Any supporting data helpers, migrations, or types the task depends on

## Default Workflow

1. Confirm the assignment includes:
   - Objective
   - Success criteria
   - In scope
   - Out of scope
   - Owned paths or areas
   - Required checks
   - Escalation triggers
   - Expected deliverable
2. Read the existing scheduling flow end to end before editing: list page, detail page, dialogs/forms, and any related calendar surface.
3. Preserve domain consistency across gigs, staffing assignments, equipment assignment touchpoints, and gig file behavior.
4. If the task requires schema, auth, or permission changes, pause and hand off to `data-auth` for the contract phase.
5. If the task changes shared component APIs or repo-wide styling, hand off to `design-system` for the polish phase.
6. Return a concise note on downstream verification needs for affected routes and behaviors.

## Verification Checklist

- Affected gig and calendar routes were smoke-checked.
- Form, dialog, and assignment flows were reviewed for behavior regressions.
- Any dependency on auth or shared data contracts was re-checked against the owning files.
- Required checks include `npm run lint`.

## Final Response Contract

- What changed
- What was verified
- Risks or findings
- Any follow-up handoff needed
