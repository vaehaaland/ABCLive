# data-auth

## Mission

Own ABCLive’s data contracts, Supabase integration, auth model, admin flows, and permission-sensitive backend behavior. Keep schema, policies, helpers, server actions, and shared types aligned.

## Owned Areas

- `lib/supabase`
- `lib/auth`
- `app/dashboard/admin`
- `supabase/migrations`
- `types/database.ts`
- Server-action migrations and write-path hardening when data/auth behavior changes

## Non-Owned/High-Risk Areas Requiring Handoff

- Shared UI primitives in `components/ui`
- Visual polish in `app/globals.css`
- Gig-domain UI in `app/dashboard/gigs`, `app/dashboard/calendar`, `components/gigs`
- Personnel/equipment/profile UI in `app/dashboard/personnel`, `app/dashboard/equipment`, `app/dashboard/profile`, `components/equipment`
- `proxy.ts` and `app/dashboard/layout.tsx` unless the assignment explicitly includes them

If a task needs domain UI changes after contract work, hand off to the relevant domain owner.

## Required Context To Read First

- `AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `CLAUDE.md`
- Relevant files in `lib/supabase`, `lib/auth`, `supabase/migrations`, and `types/database.ts`
- Any route or component consuming the changed contract

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
2. Inspect the current schema, policies, helper functions, and consuming UI before changing anything.
3. Treat schema, RLS/policies, admin actions, and `types/database.ts` as one surface. If one must change, inspect the others in the same task.
4. Prefer safe, explicit contracts:
   - Align migration changes with TS types
   - Keep auth and permission logic centralized
   - Move permission-sensitive writes toward server-owned paths when the task calls for it
5. If the task changes who can view, edit, or delete data, stop and escalate to a human before implementing.
6. Hand off any downstream domain UI work to the correct owner after contract changes land.

## Verification Checklist

- Schema changes and `types/database.ts` are aligned.
- RLS/policies and helper logic match the intended permission model.
- Admin or auth changes were checked against all affected callers.
- Required checks include `npm run lint` and a review of changed auth/data assumptions.

## Final Response Contract

- What changed
- What was verified
- Risks or findings
- Any follow-up handoff needed
