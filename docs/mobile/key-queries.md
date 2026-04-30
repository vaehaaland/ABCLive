# ABCLive — Key Screen Queries (Mobile Reference)

Extracted from the four most important web screens. Each section shows the exact fields selected and the shape of the response. These patterns are what mobile should replicate using the Supabase client SDK.

All queries use the authenticated user's JWT. `supabase.auth.getUser()` returns `user.id` which equals `profiles.id`.

---

## 1. Gig List (`/dashboard/gigs`)

### Bootstrap (parallel, fire on mount)

```ts
// 1a. Current user's profile — determines admin/technician view split
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_superadmin')
  .eq('id', userId)
  .single()

// 1b. Current user's assignments — used to compute "My Gigs" filter
const { data: myAssignments } = await supabase
  .from('gig_personnel')
  .select('gig_id, role_on_gig, assignment_status')
  .eq('profile_id', userId)

// 1c. Company memberships — determines company filter tabs
const { data: memberships } = await supabase
  .from('company_memberships')
  .select('company_id, companies(id, name, slug)')
  .eq('profile_id', userId)
```

### Gig list query

```ts
// Always filter deleted_at IS NULL unless admin explicitly requests deleted gigs
const { data: gigs } = await supabase
  .from('gigs')
  .select('id, name, gig_type, venue, client, start_date, end_date, status, icloud_uid, company_id, deleted_at')
  .is('deleted_at', null)
  // Exclude past gigs by default (show gigs ending within last 3 days or in future)
  .gt('end_date', format(subDays(new Date(), 3), 'yyyy-MM-dd'))
  // Optional: filter to user's gigs only
  // .in('id', myGigIds)
  // Optional: filter by company
  // .eq('company_id', companyId)
  // Optional: search
  // .or('name.ilike.%q%,venue.ilike.%q%,client.ilike.%q%')
  // Optional: status filter
  // .in('status', ['confirmed', 'draft'])
  .order('start_date', { ascending: true })
  .order('name', { ascending: true })
```

### Stats bar counts (parallel with gig list)

```ts
const { data: statsData } = await supabase
  .from('gigs')
  .select('status')
  .neq('status', 'cancelled')
  .is('deleted_at', null)
// Then count in-memory: draft / confirmed / completed / total
```

### "No personnel" indicator (after gig list loads)

```ts
// Check which gigs have at least one person assigned
const { data: hasPersonnel } = await supabase
  .from('gig_personnel')
  .select('gig_id')
  .in('gig_id', gigIds)

const { data: hasExternalPersonnel } = await supabase
  .from('gig_external_personnel')
  .select('gig_id')
  .in('gig_id', gigIds)

// Gigs not in either set have no personnel — flag them visually
```

**Response shape per gig:**
```ts
{
  id: string
  name: string
  gig_type: 'single' | 'festival'
  venue: string | null
  client: string | null
  start_date: string          // 'YYYY-MM-DD'
  end_date: string            // 'YYYY-MM-DD'
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  icloud_uid: string | null   // show a cloud sync badge if non-null
  company_id: string
  deleted_at: string | null   // non-null = soft-deleted
}
```

---

## 2. Gig Detail (`/dashboard/gigs/[id]`)

All queries fire in parallel after the gig row is fetched.

### 2a. Gig row (admin sees price fields, technician does not)

```ts
// Admin select
const gigSelectAdmin =
  'id, name, gig_type, public_report_enabled, public_report_slug, venue, client, start_date, end_date, description, status, price, price_notes, created_by, created_at, icloud_uid, company_id, deleted_at, company:company_id(id, name, slug)'

// Technician select (no price/price_notes)
const gigSelectTech =
  'id, name, gig_type, public_report_enabled, public_report_slug, venue, client, start_date, end_date, description, status, created_by, created_at, icloud_uid, company_id, deleted_at, company:company_id(id, name, slug)'

const { data: gig } = await supabase
  .from('gigs')
  .select(isAdmin ? gigSelectAdmin : gigSelectTech)
  .eq('id', gigId)
  .single()
```

If `gig === null` → 404. If technician and `gig.deleted_at !== null` → 404.

### 2b. Personnel (parallel)

```ts
const { data: personnel } = await supabase
  .from('gig_personnel')
  .select(`
    id,
    role_on_gig,
    notes,
    assignment_status,
    responded_at,
    response_note,
    profiles!gig_personnel_profile_id_fkey(
      id, full_name, nickname, phone, role, avatar_url
    )
  `)
  .eq('gig_id', gigId)
```

**Key note:** Filter `assignment_status !== 'declined'` for default display. Show declined count separately and let user toggle. Find the current user's row with `personnel.find(r => r.profiles.id === userId)` — if `assignment_status === 'pending'`, show the Accept/Decline dialog.

### 2c. Equipment (parallel)

```ts
const { data: equipment } = await supabase
  .from('gig_equipment')
  .select('id, quantity_needed, notes, packed, request_status, equipment(id, name, category, quantity)')
  .eq('gig_id', gigId)
```

`request_status === null` = same-company assignment, no approval needed. Non-null = cross-company request.

### 2d. Files (parallel)

```ts
const { data: files } = await supabase
  .from('gig_files')
  .select('*')
  .eq('gig_id', gigId)
  .order('created_at', { ascending: false })
```

To download: generate a signed URL from the `gig-files` bucket using `file.storage_path`.

### 2e. Comments (parallel)

```ts
const { data: comments } = await supabase
  .from('gig_comments')
  .select('*, profiles(id, full_name, nickname, avatar_url)')
  .eq('gig_id', gigId)
  .order('created_at', { ascending: true })
```

Thread comments client-side: rows with `parent_id === null` are top-level; rows with `root_id === X` are replies under thread X.

### 2f. Checklist (parallel)

```ts
const { data: checklist } = await supabase
  .from('gig_checklist_items')
  .select('*, checker:checked_by(id, full_name, nickname)')
  .eq('gig_id', gigId)
  .order('order_index', { ascending: true })
```

### 2g. External personnel (parallel)

```ts
const { data: externalPersonnel } = await supabase
  .from('gig_external_personnel')
  .select('*')
  .eq('gig_id', gigId)
  .order('created_at', { ascending: true })
```

### 2h. Program items (festival only — only if `gig.gig_type === 'festival'`)

```ts
const { data: programItems } = await supabase
  .from('gig_program_items')
  .select('*')
  .eq('gig_id', gigId)
  .order('start_at', { ascending: true })

// Then fetch personnel and equipment for all program items in parallel
const programItemIds = programItems.map(i => i.id)

const [{ data: itemPersonnel }, { data: itemEquipment }] = await Promise.all([
  supabase
    .from('gig_program_item_personnel')
    .select('id, program_item_id, role_on_item, notes, profiles(id, full_name, nickname, phone, role, avatar_url)')
    .in('program_item_id', programItemIds),
  supabase
    .from('gig_program_item_equipment')
    .select('id, program_item_id, quantity_needed, notes, equipment(id, name, category, quantity)')
    .in('program_item_id', programItemIds),
])
// Group by program_item_id client-side using a Map
```

---

## 3. Notifications

### Fetch unread count (badge)

```ts
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('read', false)
```

### Fetch inbox list

```ts
const { data: notifications } = await supabase
  .from('notifications')
  .select(`
    id,
    type,
    read,
    created_at,
    gig_id,
    comment_id,
    ticket_id,
    actor:actor_id(id, full_name, nickname, avatar_url),
    gig:gig_id(id, name),
    ticket:ticket_id(id, title)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50)
```

**Response shape:**
```ts
{
  id: string
  type: NotificationType
  read: boolean
  created_at: string
  gig_id: string | null
  comment_id: string | null
  ticket_id: string | null
  actor: { id: string; full_name: string | null; nickname: string | null; avatar_url: string | null } | null
  gig: { id: string; name: string } | null
  ticket: { id: string; title: string } | null
}
```

### Mark all read

```ts
await supabase
  .from('notifications')
  .update({ read: true })
  .eq('user_id', userId)
  .eq('read', false)
```

### Mark single read

```ts
await supabase
  .from('notifications')
  .update({ read: true })
  .eq('id', notificationId)
  .eq('user_id', userId)   // RLS enforces this; explicit eq is defensive
```

### Realtime subscription (recommended over polling)

```ts
const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // payload.new is a Notification row
    incrementUnreadBadge()
    prependToInbox(payload.new)
  })
  .subscribe()
```

---

## 4. Gig Assignment Respond

The technician's own assignment row is found on the gig detail query (section 2b above). When `assignment_status === 'pending'`, show accept/decline UI.

### Accept or decline

```ts
await supabase
  .from('gig_personnel')
  .update({
    assignment_status: 'accepted',   // or 'declined'
    responded_at: new Date().toISOString(),
    response_note: optionalNote,     // string | null
  })
  .eq('id', assignmentId)
  // The RLS policy restricts updates to rows where profile_id = auth.uid()
  // so no extra .eq('profile_id', userId) is strictly required,
  // but including it is good defensive practice.
  .eq('profile_id', userId)
```

After a successful update, the DB trigger (`025_gig_assignment_notifications_trigger.sql`) automatically fires a `gig_assignment_response` notification to the admin who made the assignment. No extra client-side notification call needed.

### Real-time: watch your own assignment for admin changes

```ts
supabase
  .channel(`my-assignment:${assignmentId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'gig_personnel',
    filter: `id=eq.${assignmentId}`,
  }, (payload) => {
    refreshAssignmentState(payload.new)
  })
  .subscribe()
```

---

## 5. Push Token Registration

```ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

async function registerPushToken(userId: string) {
  if (!Device.isDevice) return          // skip simulators

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const { data: token } = await Notifications.getExpoPushTokenAsync()

  await supabase.from('mobile_push_tokens').upsert({
    profile_id: userId,
    expo_push_token: token,
    platform: Platform.OS,             // 'ios' | 'android'
    last_seen_at: new Date().toISOString(),
    is_active: true,
  }, { onConflict: 'expo_push_token' })
}
```

Call this:
- After successful login
- On every app foreground / `AppState` `active` event
- After logout: set `is_active: false` for the current token before clearing session

---

## Display name helper

Use `nickname ?? full_name ?? 'Ukjend'` everywhere a person's name appears. The web app uses `getDisplayName(person, 'Ukjend')` which does exactly this.
