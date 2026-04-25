# Gig Assignment Push Contract (Mobile)

This document is the source-of-truth contract for cross-repo coordination between ABCLive backend and mobile clients for gig assignment push notifications and response handling.

## Scope and goals

This contract defines:

- Push notification event types for gig assignment lifecycle updates.
- The canonical payload shape mobile should expect.
- Required app integration flows (token registration, notification handling, deep links, and in-app actions).
- API/action contract for accepting/declining assignments.
- Idempotency and offline behavior expectations.
- UX copy guidance for request/accepted/declined states.

## Notification event types

The backend sends one of the following `event_type` values:

- `gig_assignment_request`
- `gig_assignment_accepted`
- `gig_assignment_declined`

### Event intent

- `gig_assignment_request`: a user has been asked to accept or decline a specific gig assignment.
- `gig_assignment_accepted`: the assignment has been accepted.
- `gig_assignment_declined`: the assignment has been declined.

## Canonical payload schema

Mobile clients should parse push payloads using the schema below. Unknown fields should be ignored (forward compatibility).

```json
{
  "notification_id": "uuid",
  "event_type": "gig_assignment_request | gig_assignment_accepted | gig_assignment_declined",
  "timestamp": "ISO-8601 UTC datetime",
  "gig": {
    "id": "uuid",
    "name": "string"
  },
  "assignment": {
    "id": "uuid",
    "status": "pending | accepted | declined"
  },
  "assigned_by": {
    "id": "uuid",
    "display_name": "string",
    "role": "optional string"
  },
  "deep_link": "abclive://gigs/{gigId}?assignment={assignmentId}"
}
```

### Field notes

- `notification_id` is globally unique for the pushed notification and can be used for dedupe in client storage/analytics.
- `timestamp` is authoritative event emission time in UTC.
- `gig.id` and `assignment.id` are required identifiers for routing and mutation APIs.
- `assignment.status` reflects server state at emission time.
- `assigned_by` identifies the actor who initiated/owns the assignment flow context.
- `deep_link` should be treated as a convenience. If omitted, clients should construct from `gig.id` + `assignment.id`.

## Required mobile app flows

### 1) Token registration lifecycle

Mobile apps must register an Expo push token:

- On successful login/session creation.
- On app open / app foreground transitions (to refresh token drift and permissions state).

Minimum client behavior:

- Request notification permissions (if not yet granted).
- Retrieve current Expo push token.
- Upsert token against current authenticated user/device installation.
- Re-attempt token registration when auth context changes (logout/login as different user).

### 2) Notification handling (foreground and background)

Clients must handle:

- Foreground receive: show in-app banner/toast and update unread/inbox state.
- Background tap/open: route user to deep link target and hydrate the assignment detail state.

Tap handling requirements:

- Parse payload safely; if parsing fails, route to a safe default (`/gigs` list equivalent).
- Avoid duplicate navigation when the same notification is processed multiple times.
- Mark notification as handled/read locally (and remotely if read APIs exist).

### 3) Deep link targets

Canonical deep link target:

- `abclive://gigs/{gigId}?assignment={assignmentId}`

Navigation contract:

- If gig exists and assignment exists: open gig assignment detail view.
- If gig exists but assignment is no longer actionable: open gig screen and display current status.
- If gig is unavailable (deleted/permission revoked): show a non-blocking error state and return to gigs list.

### 4) In-app assignment actions

For `gig_assignment_request`, the assignment detail screen must provide:

- Primary action: **Accept assignment**
- Secondary action: **Decline assignment**

Action UX behavior:

- Disable action buttons while request is in-flight.
- Show optimistic progress indicator.
- Resolve with authoritative server status and timestamp.
- If server returns conflict/already-resolved, refresh assignment state and show informational message.

## API/action contract for responding to assignments

The mobile client must call a backend action/API that mutates assignment status.

## Request

Use a single mutation endpoint/action with explicit target status:

```json
{
  "assignment_id": "uuid",
  "response": "accepted | declined",
  "client_request_id": "uuid",
  "responded_at": "ISO-8601 UTC datetime"
}
```

### Request requirements

- `assignment_id` is required.
- `response` is required and must be one of `accepted` or `declined`.
- `client_request_id` is required for idempotency (unique per logical user intent).
- `responded_at` is optional but recommended for diagnostics.

## Response

```json
{
  "assignment_id": "uuid",
  "status": "accepted | declined | pending",
  "updated_at": "ISO-8601 UTC datetime",
  "resolved_by": {
    "id": "uuid",
    "display_name": "string"
  },
  "idempotent_replay": false
}
```

### Response semantics

- Successful accept/decline returns final authoritative `status`.
- `idempotent_replay: true` indicates duplicate submission with same `client_request_id`; client should treat as success.
- Conflict cases (already resolved by another actor/request) should still return current `status` with a domain error code if applicable.

## Idempotency and offline behavior

### Idempotency

- Clients must generate a new UUID `client_request_id` per user tap intent.
- Retries of the same intent must reuse the same `client_request_id`.
- Backend should guarantee exactly-once logical processing per `(assignment_id, client_request_id, actor)`.

### Offline and flaky-network expectations

- If offline at action time, queue the intent locally with `client_request_id`.
- Replay queued intents in order when connectivity resumes.
- Keep UI state as **Pending sync** until server confirmation arrives.
- If replay result is conflict/already resolved, surface current state and clear queued intent.
- Never enqueue duplicate intents for repeated taps while one queued/in-flight intent for same assignment+response already exists.

Recommended client state labels:

- `pending_user_action` (server `pending`)
- `pending_sync` (local queued action)
- `accepted`
- `declined`
- `resolved_elsewhere` (server conflict)

## UX copy guidelines

Use concise, action-oriented copy with explicit status.

### Request state (`gig_assignment_request`)

- Push title: `New gig assignment`
- Push body: `You were assigned to {gigName}. Review and respond.`
- Screen header: `Respond to assignment`
- Primary CTA: `Accept assignment`
- Secondary CTA: `Decline`

### Accepted state (`gig_assignment_accepted`)

- Push title: `Assignment accepted`
- Push body: `Your assignment for {gigName} is confirmed.`
- Screen status badge: `Accepted`
- Helper text: `You’re confirmed for this gig.`

### Declined state (`gig_assignment_declined`)

- Push title: `Assignment declined`
- Push body: `You declined the assignment for {gigName}.`
- Screen status badge: `Declined`
- Helper text: `You can review gig details, but this assignment is closed.`

### Copy style constraints

- Prefer plain language over internal terminology.
- Keep push body concise (single sentence).
- Avoid blame phrasing for conflict/resolution races; use neutral wording.
- Localize all user-facing strings.

## Versioning and change management

- Additive payload changes are allowed without breaking older clients.
- Breaking changes require:
  - New contract version section in this document.
  - Coordinated backend + mobile release plan.
  - Migration window with dual-format support where feasible.

## Ownership

- Backend owner: assignment event emission, payload integrity, idempotent mutation semantics.
- Mobile owner: token lifecycle, notification/deep-link handling, action UX, offline queueing.
- Shared responsibility: contract drift prevention and updates to this document whenever event/API semantics change.
