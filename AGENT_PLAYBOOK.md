# ABCLive Agent Playbook

This document is the authoritative workflow for multi-agent work in this repo. `AGENTS.md` is the entry point; this file defines how work is assigned, sequenced, handed off, and verified.

## Operating Model

- One lead human or lead agent scopes the task, chooses the primary owner, and decides when a handoff is needed.
- Each task has exactly one primary writer at a time. Other agents may explore or review, but they do not edit the owner’s files without an explicit handoff.
- `architecture-explorer` is read-only. Use it to map code placement, trace dependencies, and inspect relevant Next 16 docs before implementation.
- Every implementation task ends with `quality-review`. Work is not complete until verification and review have been reported.
- Cross-cutting work follows the same order unless a human says otherwise: discovery first, contract changes second, domain implementation third, polish fourth, verification last.

## Standing Roster

| Agent | Primary use |
|---|---|
| `architecture-explorer` | Read-only discovery, placement, impact analysis, dependency tracing |
| `data-auth` | Supabase schema, auth, admin flows, RLS/policies, shared contracts, server-action migration |
| `gigs-calendar` | Gigs, calendar, assignment flows, gig detail behavior, gig file workflows |
| `people-equipment` | Personnel, equipment, utilization, availability, profile-operational features |
| `design-system` | Shared UI primitives, styling tokens, layout polish, consistency with `DESIGN.md` |
| `quality-review` | Verification, regression review, findings-first code review |

## Decision Table

| If the task looks like this | Start here | Then involve |
|---|---|---|
| Add a new gig field with a Supabase migration | `data-auth` | `gigs-calendar`, `quality-review` |
| Change login, admin user management, or auth/session behavior | `data-auth` | `quality-review` |
| Update gig detail flows, calendar views, attachments, or assignment UI | `gigs-calendar` | `design-system` if shared UI changes, then `quality-review` |
| Update personnel dashboards, equipment inventory, or availability/utilization rules | `people-equipment` | `design-system` if shared UI changes, then `quality-review` |
| Redesign equipment cards or shared component styling | `design-system` | `people-equipment` if behavior changes, then `quality-review` |
| Investigate where a new feature should live | `architecture-explorer` | whichever owning agent is chosen next |

## Assignment Contract

Every delegated task must include these fields:

- Objective
- Success criteria
- In scope
- Out of scope
- Owned paths or areas
- Required checks
- Escalation triggers
- Expected deliverable

If any of these are missing, the receiving agent should stop, restate what is missing, and ask the lead human or lead agent to tighten the assignment before implementation continues.

## Completion Contract

Every agent handoff or finish message must include:

- What changed
- What was verified
- Risks or findings
- Any follow-up handoff needed

`quality-review` reports findings first. If there are no findings, it should say so explicitly and then note any residual risk or untested surface.

## Ownership and Write Boundaries

Single-writer ownership is strict for the current task window.

- `data-auth` owns `lib/supabase`, `lib/auth`, `app/dashboard/admin`, `supabase/migrations`, and `types/database.ts`.
- `gigs-calendar` owns `app/dashboard/gigs`, `app/dashboard/calendar`, and `components/gigs`.
- `people-equipment` owns `app/dashboard/personnel`, `app/dashboard/equipment`, `app/dashboard/profile`, `components/equipment`, and profile-operational components.
- `design-system` owns `components/ui`, shared design tokens, and `app/globals.css`.
- `quality-review` does not own product files; it owns verification, review, and regression reporting.
- `architecture-explorer` is read-only and does not take ownership of implementation files.

The following hotspots require explicit handoff before anyone edits them:

- `types/database.ts`
- `proxy.ts`
- `app/dashboard/layout.tsx`
- `app/globals.css`
- Any Supabase migration that changes schema or policies

Additional coupling rules:

- Schema changes and `types/database.ts` updates travel together.
- Auth model, session, or permission changes require `data-auth` ownership even if UI files also change.
- Shared component API changes require `design-system` ownership or an explicit handoff into `design-system`.

## Escalation Rules

Stop and ask a human before proceeding if the task requires any of the following:

- Auth model changes or user-permission model changes
- New or modified RLS/policy behavior
- Destructive or irreversible migrations
- Secret handling or environment variable changes
- Cross-domain behavior changes that alter who can see, edit, or delete data
- A change that needs two agents to edit the same hotspot file at the same time

## Phase Plan for Cross-Cutting Features

Use this order unless the lead human explicitly chooses another sequence.

1. Discovery
   `architecture-explorer` maps where the feature belongs, lists impacted files and contracts, and confirms any Next 16-specific constraints.
2. Contract changes
   `data-auth` updates migrations, shared auth/data helpers, and `types/database.ts` when the feature changes data shape or permissions.
3. Domain implementation
   The relevant domain owner implements behavior in its owned routes and components.
4. Polish
   `design-system` handles shared UI primitives, styling consistency, and design-language cleanup when needed.
5. Verification
   `quality-review` runs checks, reviews the diff, and reports findings first.

## Minimum Verification Matrix

The lead owner or `quality-review` should tailor checks to the task, but the default matrix is:

- `npm run lint`
- Smoke-check the routes directly affected by the change
- Re-check any changed auth, permission, or data assumptions against the relevant migration/helper/type files
- Confirm any shared component API changes against all touched consumers

## Usage Notes

- Keep prompts and handoffs plain Markdown so they can be pasted into Codex, Claude, or a human task brief.
- Prefer small, bounded assignments over broad “own the whole feature” requests.
- Reuse the standing roster before inventing new specialist roles. Add new agents only when a repeated workflow no longer fits the current boundaries.
