# Schema — ResolveHQ

## Every table's columns and types

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String, required | |
| `email` | String, required, unique | lowercased/trimmed before save |
| `hashpassword` | String, required | bcrypt hash, `select: false` — never returned unless explicitly requested |
| `role` | String enum: `agent`, `supervisor` | defaults to `agent`; never settable from public signup |
| `createdAt` / `updatedAt` | Date | automatic (timestamps) |

### Ticket
| Field | Type | Notes |
|---|---|---|
| `subject` | String, required | |
| `description` | String, required | |
| `requester` | Embedded object `{ name, email }`, required | not a reference — see denormalization below |
| `priority` | String enum: `low`, `medium`, `high`, `urgent`, required | |
| `category` | String enum: `billing`, `technical`, `account`, `general`, required | |
| `status` | String enum: `new`, `open`, `pending`, `resolved`, `closed` | defaults to `new` |
| `primaryAssignee` | ObjectId → User, default `null` | optional — a ticket can be unassigned |
| `collaborators` | [ObjectId → User] | zero or more |
| `archived` / `archivedAt` | Boolean / Date | soft-hide from default queue views, never a delete |
| `slaTargetMinutes` | Number, required | copied from priority **at creation time** — see denormalization |
| `clock.accumulatedMs` | Number, default 0 | time already banked before the current running period |
| `clock.runningSince` | Date, default `null` | `null` while paused (Pending/Resolved/Closed); a timestamp while running (New/Open) |
| `resolvedAt` | Date, default `null` | cleared if the ticket leaves Resolved again |
| `closedAt` | Date, default `null` | used to enforce the reopen window |
| `createdAt` / `updatedAt` | Date | automatic |

### Message
| Field | Type | Notes |
|---|---|---|
| `ticket` | ObjectId → Ticket, required | |
| `author` | ObjectId → User, required | |
| `body` | String, required | |
| `type` | String enum: `reply`, `internal_note`, required | `reply` = customer-visible |
| `createdAt` | Date | automatic; no `updatedAt` — messages aren't edited |

### TimelineEvent (base) + 9 discriminators
| Field (base) | Type | Notes |
|---|---|---|
| `ticket` | ObjectId → Ticket, required | |
| `actor` | ObjectId → User, required | |
| `type` | discriminator key | which subtype this row is |
| `createdAt` | Date | automatic; no `updatedAt` — append-only |

| Discriminator | Extra fields |
|---|---|
| `status_change` | `oldStatus`, `newStatus` (String) |
| `assignment` | `oldAssignee` (ObjectId, nullable), `newAssignee` (ObjectId) |
| `collaborator_added` / `collaborator_removed` | `collaborator` (ObjectId → User) |
| `priority_change` | `oldPriority`, `newPriority` (String) |
| `reply` / `internal_note` | `message` (ObjectId → Message) |
| `archived` / `restored` | no extra fields — the event type itself is the whole fact |

### SLAAlert
| Field | Type | Notes |
|---|---|---|
| `ticket` | ObjectId → Ticket, required | |
| `type` | String enum: `at_risk`, `breached`, required | |
| `acknowledged` | Boolean, default `false` | |
| `acknowledgedBy` | ObjectId → User, default `null` | |
| `acknowledgedAt` | Date, default `null` | |
| `createdAt` / `updatedAt` | Date | automatic |

---

## Which relationships are one-to-many versus many-to-many

**One-to-many:**
- `User` → `Ticket` (as `primaryAssignee`) — one agent, many tickets assigned to them
- `Ticket` → `Message` — one ticket, many messages
- `Ticket` → `TimelineEvent` — one ticket, many timeline rows
- `Ticket` → `SLAAlert` — one ticket can have several alert *cycles* over its life (breach →
  acknowledge → resolve → reopen → breach again → a second, independent alert row)

**Many-to-many:**
- `User` ↔ `Ticket` via `collaborators` — one agent can collaborate on many tickets, and one
  ticket can have many collaborators. This is the one genuine many-to-many in the schema, and
  it's modeled as a plain array of ObjectId references on `Ticket` rather than a separate join
  collection, since the array is always small and bounded (a handful of agents per ticket, never
  unbounded growth) — a join collection would be the textbook-correct move at a much larger
  scale, but it buys nothing here.

**Not a relationship at all:** `Ticket.requester` looks like it should reference something, but
it doesn't — there's no `Customer` collection, because customers never log in or have their own
record in this system. See denormalization below for why that's deliberate, not an oversight.

---

## Which constraints live in the database versus the application

**Mongoose/schema-level (structural correctness only):**
- Required fields, enum membership (`status`, `priority`, `category`, `role`, message/alert
  `type`)
- Email uniqueness (`User.email`)
- One custom `pre("validate")` hook: a ticket's `primaryAssignee` cannot also appear in its own
  `collaborators` array — this is the one piece of cross-field validation pushed down to the
  schema level, because it's a pure data-shape rule with no role or timing dependency, unlike
  everything below.

**Application-layer only (Mongoose/MongoDB has no way to express these):**
- The entire status transition graph (`new → open → pending → resolved → closed`, plus the
  reopen exceptions) — which moves are legal from which state
- Closing a ticket requires the actor to be a supervisor
- Reopening a closed ticket is rejected once the fixed reopen window has passed
- The SLA clock pause/resume logic tied to status
- "An agent can only act on a ticket where they're the primary assignee or a collaborator"
- "An agent cannot reassign a ticket away from themselves"
- Append-only enforcement on `TimelineEvent` — there is no update or delete *route* for it
  anywhere in the API; Mongo itself would happily allow a write if one existed, so the guarantee
  is entirely "we never built that endpoint," not a database-level immutability constraint

The split follows one rule throughout: Mongoose validates that stored data has a *valid shape*;
everything about whether a specific *operation* is allowed lives in the service/controller layer,
because those rules depend on who's asking and what state something is currently in — information
a schema-level validator doesn't have access to.

---

## What was deliberately denormalized

- **`Ticket.slaTargetMinutes` is copied from the priority-to-minutes mapping at creation time**,
  not recalculated from `priority` on every read. If the organization's SLA policy changes later
  (urgent drops from 60 minutes to 30, say), existing tickets keep the target they were created
  under rather than silently inheriting a new one. This is a deliberate snapshot, and it's the
  reason `slaTargetMinutes` exists as its own field instead of being derived on the fly.
- **`Ticket.requester` is embedded, not referenced.** A `Customer` collection was considered and
  rejected — the brief requires requester information on a ticket, not a customer account or
  portal, so the requester is ticket-specific contact data, not an independent entity with its
  own identity to look up. The cost is that the same customer's name/email could appear
  duplicated across several of their tickets; that's acceptable since there's no requirement to
  ever query "all tickets from this customer" as a first-class feature.
- **`Message` and `TimelineEvent` are separate collections from `Ticket`, not embedded arrays.**
  A ticket can accumulate an unbounded number of replies and timeline events over its life;
  embedding either would mean the `Ticket` document grows without limit and every ticket-list
  query would either drag that growing array along or need a projection to exclude it. Keeping
  them as their own collections, referenced by `ticket`, keeps the `Ticket` document itself small
  and bounded regardless of how much conversation or history piles up.

---

## What would break first at 100x the data

- **Every `Ticket.find()` filter (status, priority, category, assignee) currently has no
  supporting compound index.** At 100x the volume, the role-scoped queue list and any
  filtered search would degrade into full collection scans. The first index I'd add is a
  compound one ordered by the fields actually used together in `listTickets` —
  `{ status: 1, priority: 1, category: 1, primaryAssignee: 1, createdAt: -1 }` — following the
  equality-fields-then-sort-field ordering rule, since every one of those fields is filtered on
  equality except the trailing sort.
- **Search uses `$regex` over `subject`/`description`, not a `$text` index or a real search
  service.** This was a deliberate simplification given this project's scale, but a `$regex`
  scan doesn't use an index at all — it's the single query most likely to visibly slow down
  first, and the honest next step would be either a MongoDB `$text` index (for basic relevance)
  or Atlas Search (for anything closer to production-grade full-text search).
- **The dashboard's SLA-breach count is computed in application code**, by fetching every
  currently-active ticket and running `isBreached()` over the array in JavaScript, rather than
  inside the aggregation pipeline. At small scale this is simpler and easier to reason about; at
  100x the data, pulling every active ticket into Node just to filter it there would be the
  first thing to rewrite as a proper aggregation stage.
- **The SLA sweep job scans every ticket in a running state every 60 seconds, in full**, with no
  incremental "only check tickets close to their target" narrowing. At 100x the tickets, this
  sweep's cost grows linearly with the number of open tickets in the whole system, not with how
  many are actually near breaching — the fix would be to only sweep tickets whose computed
  time-remaining falls under some threshold, rather than every open ticket unconditionally.
