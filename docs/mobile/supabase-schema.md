# ABCLive — Supabase Schema Handoff (Mobile)

This document is the canonical reference for the Supabase data model as seen from a mobile client. It covers every table, enum, RLS rule, and pattern that a mobile developer needs to know to build against the ABCLive backend.

Related docs:
- [`gig-assignment-push-contract.md`](./gig-assignment-push-contract.md) — push notification payload and assignment workflow

---

## Auth

ABCLive uses Supabase Auth. Every row in `auth.users` is automatically mirrored to `public.profiles` via an `AFTER INSERT` trigger (`handle_new_user`).

- **Login method:** email/password (magic link not used)
- **Session token:** Supabase JWT — include as `Authorization: Bearer <token>` on every API request
- **Profile auto-creation:** the trigger fires on signup; you do not need to insert a `profiles` row manually

The `profiles.id` is the same UUID as `auth.users.id`.

---

## Enums

All enums live in the `public` schema.

| Enum | Values |
|------|--------|
| `gig_assignment_status` | `pending` · `accepted` · `declined` |
| `equipment_request_status` | `pending` · `approved` · `denied` |
| `notification_type` | `gig_added` · `comment_mention` · `ticket_created` · `gig_assignment_request` · `gig_assignment_response` · `equipment_request` · `equipment_request_response` |
| `ticket_status` | `reported` · `open` · `in_progress` · `implemented` · `not_implemented` · `closed` |

---

## Multi-company model

ABCLive supports two companies. Every user belongs to at least one company via `company_memberships`. Every gig and every equipment item is scoped to exactly one company.

Current companies (fixed UUIDs — safe to hardcode for routing/display):

| Name | UUID |
|------|------|
| ABC Studio | `00000000-0000-0000-0000-000000000001` |
| Alvsvåg AS | `00000000-0000-0000-0000-000000000002` |

A user can be a `technician` or `admin` **per company**. Their role in `profiles.role` reflects their role in their primary company. Always use `company_memberships.role` for permission checks, not `profiles.role` directly.

---

## Tables

### `profiles`

Extends `auth.users`. One row per user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Same as `auth.users.id` |
| `full_name` | text | Display name |
| `nickname` | text | Optional short name |
| `email` | text | Synced from auth |
| `phone` | text | Optional |
| `avatar_url` | text | Public URL; stored in Supabase Storage |
| `role` | text | `admin` or `technician` (primary company role) |
| `primary_role` | text | Job title / specialist role (e.g. "FOH Engineer") |
| `primary_company_id` | uuid FK → companies | User's main employer |
| `is_superadmin` | boolean | App-level superadmin, not company-scoped |
| `created_at` | timestamptz | |

**RLS:**
- Users can read/update their own row
- Admins can read all profiles in their company
- Superadmins can read all profiles

---

### `companies`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text | |
| `slug` | text unique | URL-safe identifier |
| `created_at` | timestamptz | |

**RLS:** Users can only see companies they are a member of.

---

### `company_memberships`

Join table between users and companies. A user can belong to multiple companies with different roles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `profile_id` | uuid FK → profiles | |
| `company_id` | uuid FK → companies | |
| `role` | text | `admin` or `technician` |
| `created_at` | timestamptz | |

Unique constraint: `(profile_id, company_id)`.

**RLS:** Users can view their own memberships. Admins can view memberships for their companies.

---

### `gigs`

Core assignment/event table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `name` | text | |
| `venue` | text | |
| `client` | text | |
| `start_date` | date | Date only (no time) |
| `end_date` | date | Date only (no time) |
| `description` | text | |
| `status` | text | `draft` · `confirmed` · `completed` · `cancelled` |
| `gig_type` | text | `single` · `festival` |
| `price` | numeric | Admin-only field |
| `price_notes` | text | Admin-only field |
| `public_report_enabled` | boolean | Whether a public shareable report exists |
| `public_report_slug` | text | URL slug for the public report |
| `public_report_password_hash` | text | Bcrypt hash; compare server-side |
| `icloud_uid` | text | Internal iCloud calendar sync field |
| `created_by` | uuid FK → profiles | |
| `created_at` | timestamptz | |
| `deleted_at` | timestamptz | **Soft delete** — `NULL` = live, non-null = deleted |

**Soft delete:** Always filter `deleted_at IS NULL` unless you explicitly want deleted gigs.

```sql
-- Correct: only fetch live gigs
.from('gigs').select('*').is('deleted_at', null)
```

**RLS:**
- Admins of the gig's company: full access
- Technicians: read only their own gigs (via `gig_personnel` or `gig_program_item_personnel`)

**Important:** Technicians can only see gigs they are directly assigned to. A pending assignment (`assignment_status = 'pending'`) still grants read access.

---

### `gig_personnel`

Which users are assigned to which gig, including assignment workflow state.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `profile_id` | uuid FK → profiles | |
| `role_on_gig` | text | e.g. "FOH Engineer" |
| `notes` | text | Admin notes for this assignment |
| `assignment_status` | enum | `pending` · `accepted` · `declined` |
| `assigned_by` | uuid FK → profiles | Admin who made the assignment |
| `assigned_at` | timestamptz | |
| `responded_at` | timestamptz | When user accepted/declined |
| `response_note` | text | Optional note from the technician |

Unique constraint: `(gig_id, profile_id)`.

**RLS:**
- Admins: full access for their company's gigs
- Technicians: can read their own rows; can update `assignment_status`, `responded_at`, `response_note` on their own rows

**Assignment flow:**
1. Admin creates row → `assignment_status = 'pending'`
2. Notification sent → `gig_assignment_request` push
3. Technician accepts or declines → updates `assignment_status` + `responded_at`
4. Notification sent back → `gig_assignment_response` push

---

### `gig_equipment`

Equipment assigned to a gig, with cross-company request approval flow.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `equipment_id` | uuid FK → equipment | |
| `quantity_needed` | int | |
| `notes` | text | |
| `packed` | boolean | Whether the item has been packed for the gig |
| `request_status` | enum | `NULL` = same-company (no approval needed), otherwise `pending` · `approved` · `denied` |
| `requested_by` | uuid FK → profiles | Who requested the cross-company equipment |
| `responded_by` | uuid FK → profiles | Admin who approved/denied |
| `responded_at` | timestamptz | |
| `response_note` | text | |

**Cross-company rule:** If `request_status IS NULL`, the equipment belongs to the same company as the gig. If non-null, it is a cross-company request requiring approval from an admin of the equipment's company.

---

### `equipment`

Inventory items.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `name` | text | |
| `category` | text | |
| `description` | text | |
| `quantity` | int | Total units owned |
| `needs_service` | boolean | Flagged as needing maintenance |
| `needs_reorder` | boolean | Flagged as low stock |
| `created_at` | timestamptz | |

**Availability calculation:** Sum `gig_equipment.quantity_needed` across gigs with overlapping dates, then subtract from `equipment.quantity`. The web app does this client-side; replicate the same logic on mobile.

---

### `gig_files`

File attachments on a gig, stored in Supabase Storage.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `file_name` | text | Original filename |
| `file_size` | int | Bytes |
| `mime_type` | text | |
| `storage_path` | text | Path within the `gig-files` Storage bucket |
| `uploaded_by` | uuid FK → profiles | |
| `created_at` | timestamptz | |

To download a file, generate a signed URL from the `gig-files` bucket using `storage_path`. RLS on the storage bucket uses the `can_access_gig_file()` function — the signed URL approach bypasses this cleanly.

---

### `gig_comments`

Flat-threaded comments on a gig. Supports one level of replies.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `author_id` | uuid FK → profiles | |
| `body` | text | Supports `@mention` syntax |
| `parent_id` | uuid FK → gig_comments | Set if this is a reply; points to the direct parent |
| `root_id` | uuid FK → gig_comments | Set if this is a reply; always points to the top-level comment |
| `created_at` | timestamptz | |

**Threading:** Top-level comments have `parent_id = NULL` and `root_id = NULL`. Replies have both set. `root_id` lets you group all replies under a thread without recursion.

**Mentions:** When `@username` appears in `body`, a `comment_mention` notification is triggered automatically by a database trigger (`018_comment_mention_trigger.sql`).

---

### `gig_program_items`

Sub-events within a festival gig. Only relevant when `gigs.gig_type = 'festival'`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `name` | text | |
| `venue` | text | Sub-venue within the festival |
| `description` | text | |
| `start_at` | timestamptz | Full datetime with time zone |
| `end_at` | timestamptz | Full datetime with time zone |
| `created_at` | timestamptz | |

Note: `gigs.start_date` / `end_date` are `date` only; `gig_program_items.start_at` / `end_at` are `timestamptz`.

---

### `gig_program_item_personnel`

Technicians assigned to a specific program item (not just the overall festival gig).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `program_item_id` | uuid FK → gig_program_items | |
| `profile_id` | uuid FK → profiles | |
| `role_on_item` | text | |
| `notes` | text | |

A technician assigned to a program item can read the parent `gig` even if they are not in `gig_personnel`.

---

### `gig_program_item_equipment`

Equipment assigned to a specific program item.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `program_item_id` | uuid FK → gig_program_items | |
| `equipment_id` | uuid FK → equipment | |
| `quantity_needed` | int | |
| `notes` | text | |

---

### `gig_external_personnel`

External contractors or collaborators on a gig who are not ABCLive users.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `name` | text | |
| `company` | text | Their employer |
| `role_on_gig` | text | |
| `notes` | text | |
| `created_by` | uuid FK → profiles | |
| `created_at` | timestamptz | |

---

### `gig_checklist_items`

Per-gig checklist items, optionally linked to a template.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `gig_id` | uuid FK → gigs | |
| `template_item_id` | uuid FK → checklist_template_items | NULL if manually added |
| `title` | text | |
| `order_index` | int | Display ordering |
| `is_checked` | boolean | |
| `is_na` | boolean | "Not applicable" — skips the item |
| `checked_at` | timestamptz | |
| `checked_by` | uuid FK → profiles | |
| `comment` | text | Optional note when checking |
| `updated_at` | timestamptz | |

---

### `checklist_template_items`

Reusable checklist items that can be stamped onto a gig.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text | |
| `description` | text | |
| `order_index` | int | |
| `is_active` | boolean | Inactive items are not shown when creating checklists |
| `created_at` | timestamptz | |

---

### `availability_blocks`

Date ranges during which a technician is unavailable.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `profile_id` | uuid FK → profiles | |
| `blocked_from` | date | Inclusive start |
| `blocked_until` | date | Inclusive end |
| `reason` | text | |
| `created_at` | timestamptz | |

Used by admins when assigning personnel to detect scheduling conflicts alongside `gig_personnel`.

---

### `notifications`

In-app notification inbox. One row per notification per recipient.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | Recipient |
| `actor_id` | uuid FK → profiles | Who triggered the event |
| `type` | notification_type enum | |
| `gig_id` | uuid FK → gigs | Context gig (nullable) |
| `comment_id` | uuid FK → gig_comments | Context comment (nullable) |
| `ticket_id` | uuid FK → tickets | Context ticket (nullable) |
| `read` | boolean | Default false |
| `created_at` | timestamptz | |

**Polling vs. realtime:** The web app polls every 30 seconds. Mobile should prefer Supabase Realtime subscriptions on the `notifications` table filtered to `user_id = auth.uid()` for instant updates — or use push notifications (see below).

---

### `mobile_push_tokens`

Expo push tokens for mobile clients.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `profile_id` | uuid FK → profiles | |
| `expo_push_token` | text unique | Expo token string |
| `platform` | text | `ios` or `android` |
| `is_active` | boolean | Set to false when token expires/deregisters |
| `last_seen_at` | timestamptz | Updated each time the app checks in |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** Users can manage their own tokens (insert/update/delete). Admins can read all tokens.

**Registration:** Upsert on `expo_push_token` on every app launch and foreground event. See [`gig-assignment-push-contract.md`](./gig-assignment-push-contract.md) for full token lifecycle guidance.

```ts
// Upsert pattern (TypeScript / supabase-js)
await supabase.from('mobile_push_tokens').upsert({
  profile_id: userId,
  expo_push_token: token,
  platform: Platform.OS, // 'ios' | 'android'
  last_seen_at: new Date().toISOString(),
  is_active: true,
}, { onConflict: 'expo_push_token' })
```

---

### `notification_outbox` / `notification_push_attempts`

Server-internal delivery pipeline. Mobile clients should **not** read or write these tables directly. They exist to track push delivery state and retries. Listed here for completeness.

---

### `tickets` / `ticket_logs`

Internal bug/feature ticket system used by ABCLive users to report issues with the app itself.

**`tickets`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text | |
| `description` | text | |
| `status` | ticket_status enum | |
| `created_by` | uuid FK → profiles | |
| `assigned_to` | uuid FK → profiles | |
| `created_at` / `updated_at` | timestamptz | |

**`ticket_logs`** — activity/comment log on a ticket.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `ticket_id` | uuid FK → tickets | |
| `author_id` | uuid FK → profiles | |
| `body` | text | |
| `created_at` | timestamptz | |

---

## RLS Helper Functions

These PostgreSQL functions are `SECURITY DEFINER` and drive RLS policies. You cannot call them directly from mobile, but they determine what data you receive.

| Function | Returns true when… |
|----------|-------------------|
| `is_admin()` | Current user is admin in ANY company |
| `is_superadmin()` | Current user has `profiles.is_superadmin = true` |
| `is_admin_of_company(company_id)` | Current user is admin of the given company |
| `has_company_access(company_id)` | Current user has any membership in the given company |
| `is_admin_for_gig(gig_id)` | Superadmin OR admin of the gig's company |
| `can_access_gig(gig_id)` | Admin for gig OR assigned via gig_personnel OR assigned via program_item_personnel |

---

## Key Query Patterns

### Fetch gigs for the current user (technician view)

```ts
const { data } = await supabase
  .from('gigs')
  .select(`
    *,
    gig_personnel!inner(assignment_status, role_on_gig)
  `)
  .is('deleted_at', null)
  .eq('gig_personnel.profile_id', userId)
  .order('start_date', { ascending: true })
```

### Fetch a gig with all details

```ts
const { data } = await supabase
  .from('gigs')
  .select(`
    *,
    gig_personnel(*, profiles(id, full_name, nickname, avatar_url)),
    gig_equipment(*, equipment(*)),
    gig_files(*),
    gig_program_items(
      *,
      gig_program_item_personnel(*, profiles(*)),
      gig_program_item_equipment(*, equipment(*))
    ),
    gig_external_personnel(*)
  `)
  .eq('id', gigId)
  .is('deleted_at', null)
  .single()
```

### Fetch unread notification count

```ts
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('read', false)
```

### Mark notifications as read

```ts
await supabase
  .from('notifications')
  .update({ read: true })
  .eq('user_id', userId)
  .eq('read', false)
```

### Respond to a gig assignment

```ts
await supabase
  .from('gig_personnel')
  .update({
    assignment_status: 'accepted', // or 'declined'
    responded_at: new Date().toISOString(),
    response_note: 'Looking forward to it!', // optional
  })
  .eq('id', assignmentId)
  .eq('profile_id', userId) // RLS enforces this anyway
```

---

## Realtime Subscriptions (Recommended for Mobile)

Use Supabase Realtime to avoid polling. Subscribe to channels filtered by `user_id`.

```ts
// Notifications
supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    (payload) => handleNewNotification(payload.new)
  )
  .subscribe()

// Assignment status changes (e.g. admin updates your assignment)
supabase
  .channel('my-assignments')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'gig_personnel', filter: `profile_id=eq.${userId}` },
    (payload) => handleAssignmentUpdate(payload.new)
  )
  .subscribe()
```

---

## Storage

Bucket: `gig-files`

Access control is enforced via the `can_access_gig_file()` function. Use signed URLs — do not attempt direct public access.

```ts
const { data } = await supabase
  .storage
  .from('gig-files')
  .createSignedUrl(storagePath, 3600) // 1 hour expiry
```

---

## Things to Know

- **All IDs are UUIDs.** Never assume numeric or sequential IDs.
- **Dates vs. datetimes:** `gigs.start_date` / `end_date` are `date` (no time, no timezone). `gig_program_items.start_at` / `end_at` are `timestamptz`. Format accordingly.
- **Soft-deleted gigs:** Always add `.is('deleted_at', null)` to gig queries unless you specifically need deleted records.
- **Assignment visibility for technicians:** A technician with `assignment_status = 'declined'` still has a row in `gig_personnel` and can therefore still read the gig. Filter by `assignment_status` if you want to hide declined gigs from the calendar.
- **Cross-company equipment:** `gig_equipment.request_status IS NULL` means same-company (safe to display normally). Non-null means a cross-company approval is in progress or resolved.
- **Admin vs. technician views:** Many UI decisions hinge on whether the current user is `is_admin_of_company(companyId)`. Fetch `company_memberships` on app load and cache this per session.
- **`profiles.role` vs. `company_memberships.role`:** `profiles.role` is legacy and reflects the primary company role. For multi-company correctness always use `company_memberships.role` for the relevant company.
- **Nickname display:** Use `nickname ?? full_name` as the display name throughout the app.
- **Auto-complete cron:** A Supabase pg_cron job (`010_complete_past_gigs_cron.sql`) automatically sets past confirmed gigs to `completed`. Do not rely on `status` being stable without re-fetching.
- **`public_report_password_hash`:** Never expose this field in mobile UI. Password validation happens server-side.
- **New users:** When a new user signs up, `handle_new_user()` creates their `profiles` row and enrolls them in ABC Studio (`company_id = '00000000-0000-0000-0000-000000000001'`) as `technician` automatically.
