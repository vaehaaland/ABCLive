<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ABCLive Agent Entry Point

Start here before delegating work in this repo.

## Repo Invariants

- Inspect before editing. Read the relevant route, component, migration, and supporting docs before proposing or making changes.
- Do not use destructive git commands. Never reset, revert, or discard user changes unless a human explicitly asks for it.
- Treat Supabase schema, RLS/policies, server actions, and `types/database.ts` as a coupled surface. If one changes, review the others in the same task.
- Use one primary writer per subsystem. If a task crosses ownership boundaries, hand off explicitly instead of letting multiple agents edit the same area at once.
- Avoid overlapping writes on high-risk shared files: `types/database.ts`, `proxy.ts`, `app/dashboard/layout.tsx`, `app/globals.css`, and any Supabase migration touched in the same change as data contracts.
- Route every implementation task through verification and review before closing it out.

## Router

Use the first matching agent below, then involve `quality-review` before the work is considered complete.

| Task shape | Start with |
|---|---|
| Repo mapping, impact analysis, “where should this live?” | [`agents/architecture-explorer.md`](agents/architecture-explorer.md) |
| Supabase schema, auth, admin flows, RLS, server-action migration, shared data contracts | [`agents/data-auth.md`](agents/data-auth.md) |
| Gigs, calendar, staffing assignments, gig attachments | [`agents/gigs-calendar.md`](agents/gigs-calendar.md) |
| Personnel, equipment, availability, utilization, profile operations | [`agents/people-equipment.md`](agents/people-equipment.md) |
| Shared UI, global styling, design consistency, component polish | [`agents/design-system.md`](agents/design-system.md) |
| Verification, regression review, findings-first code review | [`agents/quality-review.md`](agents/quality-review.md) |

## Canonical Docs

- Workflow, handoffs, escalation rules, and cross-agent sequencing: [`AGENT_PLAYBOOK.md`](AGENT_PLAYBOOK.md)
- Reusable specialist prompts/specs: [`agents/`](agents)
- Repo architecture and local setup notes: [`CLAUDE.md`](CLAUDE.md), [`README.md`](README.md)
