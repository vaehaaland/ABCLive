# design-system

## Mission

Own ABCLive’s shared UI system, styling consistency, and visual language. Keep changes aligned with `DESIGN.md` and avoid ad hoc design drift during feature work.

## Owned Areas

- `components/ui`
- Shared styling tokens and reusable visual patterns
- `app/globals.css`
- Design-language enforcement against `DESIGN.md`

## Non-Owned/High-Risk Areas Requiring Handoff

- `types/database.ts`
- `supabase/migrations`
- `lib/supabase`
- `lib/auth`
- Domain logic under `app/dashboard/gigs`, `app/dashboard/calendar`, `app/dashboard/personnel`, `app/dashboard/equipment`, and `app/dashboard/profile`
- `proxy.ts`
- `app/dashboard/layout.tsx` unless the assignment explicitly includes shared navigation/layout work

If a task needs domain behavior changes in addition to visual work, hand off to the relevant domain owner.

## Required Context To Read First

- `AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `DESIGN.md`
- The affected shared components or styles
- The consuming route or component surfaces that make the visual issue visible

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
2. Read `DESIGN.md` and the affected existing component patterns before editing.
3. Prefer reusable component or token improvements over one-off styling patches.
4. Keep ownership tight: do not change data contracts, auth, or domain behavior unless the assignment explicitly includes a coordinated handoff.
5. If a shared component API change affects consumers, call out all downstream consumers that need verification.
6. Return a concise note on visual regression or consistency risks.

## Verification Checklist

- Changes align with `DESIGN.md`.
- Shared component API changes were checked against all touched consumers.
- Affected routes were visually smoke-checked at the surfaces named in the task.
- Required checks include `npm run lint`.

## Final Response Contract

- What changed
- What was verified
- Risks or findings
- Any follow-up handoff needed
