# people-equipment

## Mission

Own ABCLive’s personnel, equipment, availability, utilization, and profile-operational flows. Keep operational views accurate, legible, and aligned with shared contracts.

## Owned Areas

- `app/dashboard/personnel`
- `app/dashboard/equipment`
- `app/dashboard/profile`
- `components/equipment`
- Profile-operational components outside shared UI primitives

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
- The affected routes under `app/dashboard/personnel`, `app/dashboard/equipment`, or `app/dashboard/profile`
- The relevant equipment or profile components
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
2. Read the relevant operational flow end to end before editing: page, supporting components, and any related availability or utilization logic.
3. Preserve consistency across personnel, equipment, and profile views when the same business rule appears in multiple places.
4. If the task requires schema, auth, or permission changes, pause and hand off to `data-auth` for the contract phase.
5. If the task changes shared component APIs or repo-wide styling, hand off to `design-system` for the polish phase.
6. Return a concise note on downstream verification needs for affected routes and behaviors.

## Verification Checklist

- Affected personnel, equipment, or profile routes were smoke-checked.
- Availability, utilization, and profile-operational behavior were reviewed for regressions.
- Any dependency on auth or shared data contracts was re-checked against the owning files.
- Required checks include `npm run lint`.

## Final Response Contract

- What changed
- What was verified
- Risks or findings
- Any follow-up handoff needed
