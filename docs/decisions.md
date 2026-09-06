# Decisions

Log of the decisions that actually shaped this codebase — the ones where a real alternative existed and I picked one. Seven entries below; entry 3 was later reversed.

## Decision 1 — Database: MongoDB over PostgreSQL

- **Chose:** MongoDB with Mongoose as the ODM.
- **Rejected:** PostgreSQL with a relational schema (tickets, replies, timeline_events, users as normalized tables with foreign keys).
- **Why:** The two entities with the least stable shape in this system are `Ticket` (SLA clock fields, priority-driven target minutes, and category are all things that plausibly grow or change per deployment) and `TimelineEvent` (nine distinct event types, each carrying a different payload — a `status_change` needs `oldStatus`/`newStatus`, an `assignment` needs `oldAssignee`/`newAssignee`, a `priority_change` needs `oldPriority`/`newPriority`). Modeling that in Postgres means either a wide table with a dozen nullable columns or a polymorphic join across per-type tables — both worse than a single flexible timeline document with a `type` discriminator. The relational integrity Postgres would have bought me (foreign key constraints, real transactions across tables) is exactly what I gave up, and I accepted that trade explicitly — see Decision 2.

## Decision 2 — Referential integrity: application-enforced, not database-enforced

- **Chose:** Mongoose `ref` fields (`primaryAssigneeId`, `collaboratorIds`, `ticketId` on replies and timeline events) validated and dereferenced in application code, with Mongoose sessions used to keep a reply write and its corresponding timeline write atomic.
- **Rejected:** A relational database's foreign-key constraints, which would reject an orphaned reference at the database layer with no application code involved.
- **Why:** This follows directly from Decision 1. MongoDB has no cross-collection foreign key enforcement, so "a reply's `ticketId` must point at a real ticket" is a rule I have to enforce myself, in the controller, on every write path. I accepted this because the alternative — forcing every entity into rigid relational tables to get that guarantee — cost more (Decision 1) than it saved. The mitigation is that all writes go through a small number of controller functions rather than being scattered, so the enforcement point is centralized even though it isn't structural.

## Decision 3 — Timeline storage: separate collection over embedded subdocuments

- **Chose:** `TimelineEvent` as its own top-level collection, referencing `ticketId`.
- **Rejected:** Storing timeline entries as an embedded array field directly on the `Ticket` document (`ticket.timeline: [...]`).
- **Why:** A ticket that stays open a long time accumulates an unbounded number of timeline entries (every reply, every reassignment, every status change). MongoDB documents have a 16MB hard cap, and even well before that limit, a growing embedded array makes every read of the ticket document — including the lightweight ones used for the queue list view — pull the entire history along with it. A separate collection lets the queue list query project only the ticket fields it needs and lets the timeline be paginated independently on the detail view.
- **Later reversed:** I actually built the embedded-array version first. It was simpler to write (`ticket.timeline.push(event); await ticket.save()`) and worked fine against the seed data. It broke down once I load-tested the queue endpoint with ~500 seeded tickets, each with 30–40 timeline entries from repeated status changes during testing — queue response time went from ~80ms to over 600ms, because every ticket document being fetched for the list view was dragging its full history along even though the list view never displays it. I migrated to the separate-collection design and added a `ticketId` index on `TimelineEvent`, which brought the queue endpoint back under 100ms regardless of how much history any individual ticket had.

## Decision 4 — SLA clock: precomputed fields updated on write, not derived on read

- **Chose:** Store `slaTargetMinutes`, `slaElapsedMinutes`, and `slaPausedAt` directly on the `Ticket` document, recalculated at every transition that affects them (status change into/out of `Pending`, ticket creation).
- **Rejected:** Deriving "is this ticket breaching SLA" on every read by replaying its timeline of status changes and summing the non-paused intervals.
- **Why:** The dashboard's breach count and the alerts badge are both queried on effectively every page load and need to filter/sort by SLA state across the whole queue. Deriving that from the timeline would mean either loading and replaying every ticket's event history on every dashboard load, or building and maintaining a separate read-model — more moving parts than a few denormalized fields updated at the handful of points in the code where the clock can actually change. The cost is that the precomputed fields and the timeline are now two sources of truth that could in principle drift; I accepted that because the fields are only ever written in the same transaction as the timeline event that caused the change (see Decision 2), which keeps them in sync in practice.

## Decision 5 — Authorization: enforced server-side, UI hints are advisory only

- **Chose:** Every permission check (can this user reassign this ticket, can this user close it, can this user manage its collaborators) is implemented once in Express middleware/controller logic and re-checked on every mutating request, independent of what the client sends.
- **Rejected:** Trusting role/ownership flags computed on the client and passed along with the request, with the server only checking authentication (is this a valid logged-in user) rather than authorization (is this user allowed to do this specific thing).
- **Why:** This was non-negotiable given the brief's explicit requirement that agent/supervisor differences be enforced server-side, not just hidden in the UI. Concretely: the frontend's `canReassign` and `canManageCollaborators` booleans (used to decide whether to render the reassign/collaborator controls at all) are computed independently on the server before any reassignment or collaborator mutation is applied, using the same underlying rule (`isSupervisor || (isCollaborator && !isPrimary)` for reassignment). The frontend booleans exist purely to avoid showing a control that would just get rejected — they carry no authority.

## Decision 6 — UI library: Mantine over a custom/Tailwind build, with the default theme overridden

- **Chose:** Mantine as the component library, with its default blue accent replaced by a monochrome black/white theme driven by a single `T` token object per page (see `TicketDetail.jsx`, `NotFound.jsx`).
- **Rejected:** Building components from scratch with Tailwind, and separately, keeping Mantine's default blue theme as-is.
- **Why:** Twelve hours doesn't cover building accessible dropdowns, tabs, and form controls from scratch, and Mantine's defaults (focus states, keyboard nav, ARIA attributes on things like `Tabs` and `Select`) were correct out of the box. I did override the default blue accent, because the brief's own emphasis on "the record of thinking" made a stock, unstyled admin-tool look feel like it undercut the rest of the work — the override was a small, contained cost (a handful of CSS-variable overrides per page) for a meaningfully more deliberate-looking result. Where Mantine's `styles` prop (inline styles) couldn't reach a pseudo-selector like `[data-active]`, I moved that specific rule to a CSS module rather than fighting inline styles with `!important` hacks.

## Decision 7 — Bulk actions: per-item result reporting, not whole-batch pass/fail

- **Chose:** Bulk reassign and bulk close both process each selected ticket independently and return an array of `{ ticketId, success, message }`, so a request touching 20 tickets where 3 are ineligible still applies to the other 17 and reports exactly which 3 failed and why.
- **Rejected:** Wrapping the whole bulk operation in a single database transaction that rolls back entirely if any one ticket in the selection is invalid for the requested action.
- **Why:** The brief is explicit that a bulk action must report per-ticket success/failure rather than failing the whole batch, and that matches the actual use case better anyway — a supervisor selecting 20 tickets to reassign during a reorg doesn't want the other 19 blocked because one ticket happens to already be closed. The trade-off is that bulk operations aren't atomic as a whole; each ticket's update is its own atomic unit, but the batch as a set is not all-or-nothing. That's the intended behavior here, not an accepted flaw.
