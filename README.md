# ABCLive

ABCLive is an internal gig-planning tool for ABC Studio. It manages gigs, personnel, equipment, calendar visibility, and superadmin user management on top of Next.js and Supabase.

## Agent Workflow

- Start with [`AGENTS.md`](AGENTS.md) for the repo entry point and specialist router.
- Use [`AGENT_PLAYBOOK.md`](AGENT_PLAYBOOK.md) for ownership rules, handoffs, escalation, and verification.
- Reusable specialist prompts/specs live in [`agents/`](agents).

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in the Supabase values used by the repo.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Additional Context

- Architecture and repo-specific implementation notes: [`CLAUDE.md`](CLAUDE.md)
- Design language and UI principles: [`DESIGN.md`](DESIGN.md)
