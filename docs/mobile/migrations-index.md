# ABCLive — Migrations Index (Mobile Reference)

Use this file to verify exact field names, types, constraints, and defaults when something in `supabase-schema.md` is ambiguous. Each entry notes what the migration adds and quotes any non-obvious constraints directly from SQL.

Full SQL files live at `supabase/migrations/` in the web repo.

---

## 001 — Initial schema

Tables: `profiles`, `gigs`, `equipment`, `gig_personnel`, `gig_equipment`

Key constraints:
```sql
-- profiles
role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician'))

-- gigs
status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled'))
start_date DATE NOT NULL
end_date   DATE NOT NULL

-- equipment
quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0)

-- gig_equipment
quantity_needed INT NOT NULL DEFAULT 1 CHECK (quantity_needed > 0)
UNIQUE(gig_id, profile_id)  -- on gig_personnel
```

Trigger: `handle_new_user` — auto-creates `profiles` row on `auth.users` INSERT.

---

## 002 — Avatar

Adds `avatar_url TEXT` to `profiles`.

---

## 003 — Primary role

Adds `primary_role TEXT` to `profiles` (job title / specialist role, e.g. "FOH Engineer").

---

## 004 — Email on profiles

Adds `email TEXT` to `profiles`. Updated `handle_new_user` trigger syncs from `auth.users.email`.

---

## 005 — Gig files

Table: `gig_files`

```sql
CREATE TABLE public.gig_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id       UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_size    INT  NOT NULL,
  mime_type    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Storage bucket: `gig-files`. Files accessed via signed URLs.

---

## 006 — Gig price

Adds `price NUMERIC` and `price_notes TEXT` to `gigs`. Admin-only fields — not exposed in RLS SELECT for technicians (enforced in application layer, not by RLS).

---

## 007 — Superadmin

Adds `is_superadmin BOOLEAN NOT NULL DEFAULT FALSE` to `profiles`. Adds `is_superadmin()` helper function. Superadmins bypass company-scoped admin checks.

---

## 008 — Festival program items

Adds `gig_type TEXT NOT NULL DEFAULT 'single'` to `gigs`.

Tables: `gig_program_items`, `gig_program_item_personnel`, `gig_program_item_equipment`

```sql
-- gig_program_items
start_at TIMESTAMPTZ NOT NULL    -- full datetime, unlike gigs.start_date (DATE)
end_at   TIMESTAMPTZ NOT NULL

-- gig_program_item_equipment
quantity_needed INT NOT NULL DEFAULT 1
```

---

## 009 — Public festival reports

Adds to `gigs`:
```sql
public_report_enabled       BOOLEAN NOT NULL DEFAULT FALSE
public_report_slug          TEXT UNIQUE
public_report_password_hash TEXT
```

`public_report_slug` is globally unique. Password is bcrypt-hashed — never expose hash to mobile, validate server-side.

---

## 010 — Auto-complete past gigs (cron)

Adds `complete_past_gigs()` function and a `pg_cron` job that sets `status = 'completed'` on confirmed gigs whose `end_date < CURRENT_DATE`. Mobile must re-fetch gig status; do not assume it is stable.

---

## 011 — Gig comments

Table: `gig_comments`

```sql
CREATE TABLE public.gig_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id     UUID NOT NULL REFERENCES public.gigs(id)         ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
  body       TEXT NOT NULL,
  parent_id  UUID REFERENCES public.gig_comments(id)          ON DELETE CASCADE,
  root_id    UUID REFERENCES public.gig_comments(id)          ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Threading: top-level comments have `parent_id = NULL`, `root_id = NULL`. Replies have both set. `root_id` always points to the thread root.

---

## 012 — Notifications

Table: `notifications`. Enum: `notification_type` (initially `gig_added`, `comment_mention`).

Key RLS:
- Users can SELECT and UPDATE (`read`) only their own rows
- INSERT is server-role only (no client insert policy)

---

## 013 — Availability blocks

Table: `availability_blocks`

```sql
CREATE TABLE public.availability_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_from  DATE NOT NULL,      -- inclusive
  blocked_until DATE NOT NULL,      -- inclusive
  reason        TEXT,
  created_at    TIMESTAMPTZ
)
```

---

## 014 — Gig checklists

Tables: `checklist_template_items`, `gig_checklist_items`

```sql
-- gig_checklist_items
is_checked   BOOLEAN NOT NULL DEFAULT FALSE
is_na        BOOLEAN NOT NULL DEFAULT FALSE   -- "Not applicable"; skips the item
order_index  INT     NOT NULL DEFAULT 0
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

`checked_by` FK → profiles (alias `checker` in queries).

---

## 015 — iCloud settings

Table: `icloud_settings` — internal admin use only. Mobile should ignore.

---

## 016 — Equipment flags

Adds to `equipment`:
```sql
needs_service  BOOLEAN NOT NULL DEFAULT FALSE
needs_reorder  BOOLEAN NOT NULL DEFAULT FALSE
```

---

## 017 — Nickname

Adds `nickname TEXT` to `profiles`. Display name priority: `nickname ?? full_name`.

---

## 018 — Comment mention trigger

DB trigger that fires on `gig_comments` INSERT: parses `@mention` strings from `body`, looks up matching profiles by `nickname` or `full_name`, and inserts `comment_mention` notifications via service role. No mobile action required.

---

## 019 — Checklist N/A

Adds `is_na BOOLEAN NOT NULL DEFAULT FALSE` to `gig_checklist_items` (already included in migration 014 entry above; this migration backfills and enforces the column).

---

## 020 — Equipment packed flag

Adds `packed BOOLEAN NOT NULL DEFAULT FALSE` to `gig_equipment`. Tracks whether a piece of equipment has been physically packed for the gig.

---

## 021 — Tickets

Table: `tickets`, `ticket_logs`

```sql
-- tickets
status  ticket_status NOT NULL DEFAULT 'reported'
-- ticket_status ENUM: 'reported' | 'open' | 'in_progress' | 'implemented' | 'not_implemented' | 'closed'
assigned_to UUID NOT NULL REFERENCES profiles(id)
created_by  UUID NOT NULL REFERENCES profiles(id)
```

Internal bug/feature tracking. Mobile may show tickets but does not own this flow.

---

## 022 — Ticket notifications

Adds `ticket_created` to `notification_type` enum. Adds `ticket_id UUID` FK to `notifications`. Trigger fires when a ticket is created.

---

## 023 — Ticket logs

Table: `ticket_logs` — activity/comment log per ticket.

---

## 024 — Gig assignment workflow

Adds to `gig_personnel`:
```sql
assignment_status  gig_assignment_status NOT NULL DEFAULT 'pending'
  -- ENUM: 'pending' | 'accepted' | 'declined'
assigned_by   UUID REFERENCES profiles(id) ON DELETE SET NULL
assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
responded_at  TIMESTAMPTZ
response_note TEXT
```

Historical rows were backfilled to `assignment_status = 'accepted'`.

---

## 025 — Assignment notifications trigger

DB trigger on `gig_personnel` INSERT/UPDATE:
- On INSERT with `assignment_status = 'pending'` → inserts `gig_assignment_request` notification for assignee
- On UPDATE `pending → accepted|declined` → inserts `gig_assignment_response` notification for `assigned_by`

Deduplication: trigger checks for existing notification before inserting. Mobile does not need to create these notifications manually.

---

## 026 — Mobile push tokens + outbox

Tables: `mobile_push_tokens`, `notification_outbox`, `notification_push_attempts`

```sql
-- mobile_push_tokens
expo_push_token TEXT NOT NULL  -- UNIQUE index
platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android'))
is_active       BOOLEAN NOT NULL DEFAULT TRUE
```

Unique index on `expo_push_token` — use `upsert({ onConflict: 'expo_push_token' })`.

`notification_outbox` and `notification_push_attempts` are server-internal; no RLS SELECT policy for authenticated users.

---

## 027 — Companies and memberships

Tables: `companies`, `company_memberships`

```sql
-- companies
slug TEXT NOT NULL UNIQUE

-- company_memberships
role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician'))
UNIQUE (profile_id, company_id)
```

Fixed company UUIDs:
- `00000000-0000-0000-0000-000000000001` → ABC Studio
- `00000000-0000-0000-0000-000000000002` → Alvsvåg AS

All existing data backfilled to ABC Studio. Updated `is_admin()` to check `company_memberships.role` instead of `profiles.role`. Updated `handle_new_user` to auto-enroll new users in ABC Studio as `technician`.

Adds `primary_company_id UUID` to `profiles`.

---

## 028 — Equipment request flow (cross-company)

Adds to `gig_equipment`:
```sql
request_status  equipment_request_status  -- NULL = same-company (no approval needed)
  -- ENUM: 'pending' | 'approved' | 'denied'
requested_by   UUID REFERENCES profiles(id) ON DELETE SET NULL
responded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL
responded_at   TIMESTAMPTZ
response_note  TEXT
```

Partial index on `request_status = 'pending'` for fast admin panel lookups.

Trigger `on_gig_equipment_request_notify`:
- New pending cross-company request → `equipment_request` notification to owning company's admins
- Approve/deny → `equipment_request_response` notification to `requested_by`

`NULL` request_status = same-company assignment, display normally. Non-null = cross-company flow.

---

## 029 — External personnel

Table: `gig_external_personnel` — non-user contractors/collaborators on a gig.

```sql
CREATE TABLE public.gig_external_personnel (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id       UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  company      TEXT,
  role_on_gig  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL
)
```

RLS: Admins can manage; any authenticated user can read.

---

## 030 — Soft delete gigs

Adds `deleted_at TIMESTAMPTZ NULL` to `gigs`. Partial index on `deleted_at IS NULL` for performance.

- `NULL` = live gig
- Non-null = soft-deleted; child rows (personnel, equipment, files, etc.) survive
- Restore = set `deleted_at = NULL`
- **Always** filter `.is('deleted_at', null)` in mobile queries unless showing trash

```sql
CREATE INDEX gigs_deleted_at_idx ON public.gigs (deleted_at)
  WHERE deleted_at IS NULL;
```
