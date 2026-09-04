# ResolveHQ Development Plan

## Project Goal

Build a complete customer-support operations workspace that satisfies the ten core goals of the assessment while maintaining a clear development history and documented engineering decisions.

The assessment explicitly emphasizes incremental development, reasoning, trade-offs, and Git history rather than treating the final application as the only deliverable.

---

# Phase 1: Foundation
## Status: Completed

* Repository initialized, GitHub repository created
* Backend initialized with Node.js, Express configured
* MongoDB connection established, basic server running
* Backend folder structure established

---

# Phase 2: Data Modeling
## Status: Completed

Implemented: `User`, `Ticket`, `Message`, `TimelineEvent` (with discriminators for status_change, assignment, collaborator_added/removed, reply, internal_note, priority_change, archived, restored), `SLAAlert`.

The Ticket clock design evolved during implementation from a single `pendingSince` field to `{ accumulatedMs, runningSince }`, since the earlier shape couldn't cleanly express "paused vs. running" across more than one non-active status (Pending, Resolved, and Closed all needed to pause the clock, not just Pending).

---

# Phase 3: Authentication & Authorization
## Status: Completed and verified

* bcrypt password hashing, JWT in HttpOnly cookie, login/signup/logout
* Role-based middleware (`authenticate`, `requireRole`)
* Ticket-level access middleware (`loadTicket`, `requireTicketAccess`) enforcing "primary assignee or collaborator" per goal 1
* Public signup deliberately restricted to `role: "agent"` only — supervisor accounts are seeded separately, since open self-registration into a privileged role is a real access-control gap the brief doesn't require leaving open

### Verified by manual testing
* Agent blocked (403) from a ticket they're not assigned to or collaborating on
* Supervisor unrestricted across all tickets
* Agent blocked (403) from reassigning a ticket away from themselves
* Agent successfully reassigns/claims within the allowed rule; supervisor reassigns freely
ls
---

# Phase 4: Ticket CRUD
## Status: Implemented, not yet tested end-to-end

Create, list (role-scoped), get, update, archive, restore — all built. `createTicket` verified working; not yet re-verified across all four priorities after the most recent bug-fix round.

---

# Phase 5: Ticket Assignment
## Status: Implemented, not yet re-tested after recent fixes

Reassignment enforces: supervisors unrestricted; agents can act only if primary assignee or collaborator; agent-as-primary-assignee cannot hand the ticket to someone else. Collaborator add/remove implemented, gated to primary assignee or supervisor.

**Open decision, not yet resolved:** whether a collaborator (not primary assignee) should be able to reassign the ticket between two *other* agents. Needs a decision before final submission — see `docs/decisions.md`.

---

# Phase 6: Ticket Lifecycle
## Status: Implemented, not yet tested

State machine (`new → open → pending → resolved → closed`, with `resolved → open` and `closed → open` within a reopen window) implemented in `ticketLifecycle.service.js` as business logic, not Mongoose enum validation. Closing is restricted to supervisors. Clock runs only in `new`/`open`; pauses in `pending`, `resolved`, and `closed`.

**Not yet verified:** the full transition sequence, reopen-window rejection after expiry, and the Pending→Open auto-resume triggered by a customer-visible reply — the single most load-bearing interaction in the app, never run once yet.

---

# Phase 7: Replies and Internal Notes
## Status: Implemented, not yet tested

`Message` model with `reply`/`internal_note` types. Adding a non-internal reply to a Pending ticket is wired to call the lifecycle service and reopen it automatically. This exact path had a live bug (`req.ticket.save()` mistyped) found and fixed today — not re-tested since.

---

# Phase 8: Audit Timeline
## Status: Partially implemented

Status changes, reassignments, replies, internal notes, and collaborator add/remove are logged via discriminators. Archive/restore and priority-change events have discriminators defined but nothing calls them yet — a gap to close before submission.

Read endpoint (`GET /:id/timeline`) built, not yet tested against a ticket with a real mixed event history.

---

# Phase 9: SLA Tracking
## Status: Implemented, sweep job just wired — untested

Response clock, breach/at-risk thresholds, alert creation/acknowledgement built. A periodic sweep job (`startSlaSweep`, 60-second interval) was just wired into the server entry point today — before this it existed as dead code nothing called, meaning no alert could ever have fired.

**Not yet verified:** whether an alert appears un-prompted after the sweep interval, and whether reopening a ticket that breaches again produces a new alert rather than leaving a stale acknowledged one.

---

# Phase 10: Queue and Search
## Status: Implemented, not yet tested

Server-side regex search (chosen over a `$text` index to keep the schema simpler at this project's scale), status/priority/category/assignee filters, sort, pagination. Role-scoping and search conditions combined via `$and` to avoid a two-`$or` collision that would otherwise let an agent's query bypass their own scope restriction.

---

# Phase 11: Bulk Operations
## Status: Implemented, not yet tested

Bulk reassign and bulk close, each returning a per-ticket `{ ticketId, success, reason }` array. A route-ordering bug (bulk/export routes shadowed by `/:id` routes matched earlier) found and fixed today — not yet re-verified.

---

# Phase 12: CSV Export
## Status: Implemented, not yet tested

Reuses the same filter-building logic as search, so the export always matches whatever the queue view is currently showing.

---

# Phase 13: Dashboard
## Status: Implemented, not yet tested

Headline counts, status/agent breakdowns, 8-week resolution trend, breach count (computed in application code over fetched tickets rather than in the aggregation pipeline — a deliberate scope simplification). A missing `Ticket` import was caught and fixed today; this route has not been hit successfully yet.

---

# Phase 14: React Frontend
## Status: Not started

---

# Phase 15: Testing
## Status: In progress — the actual current bottleneck

Everything in Phases 4–13 has been *written*, not *proven*. Nothing below is marked done until it's been run and its actual response inspected.

### Test checklist, in priority order
- [ ] Full lifecycle sequence including illegal-transition rejection
- [ ] Pending → Open auto-resume via customer-visible reply
- [ ] Close restricted to supervisor; reopen-window rejection after expiry
- [ ] Access control re-verified after the recent bug-fix round
- [ ] Collaborator add/remove, including the assignee-can't-be-collaborator rule
- [ ] Search + filter combinations, scoped correctly per role
- [ ] Bulk action with a mixed valid/invalid batch (partial success reporting)
- [ ] CSV export actually downloads (route-shadowing fix verification)
- [ ] Timeline shows a correct, chronological mixed-event history
- [ ] SLA alert appears un-prompted after the sweep interval
- [ ] Reopen-and-rebreach produces a new alert, not a stale acknowledged one
- [ ] Dashboard returns real numbers without error

---

# Phase 16: Deployment
## Status: Not started

---

# Phase 17: Final Submission
## Status: Not started

Stretch ideas from the brief (canned responses, CSAT rating, status page, tagging, knowledge base, auto-routing, ticket merging, priority-varying SLA policies, email digest) are explicitly out of scope until all ten core goals are tested and confirmed working — the brief states these don't substitute for a core goal and doing ten well beats ten plus extras done badly.

---

# Development Workflow

```text
Understand requirement → Design → Record decision → Implement → Test → Update documentation → Meaningful Git commit
```

---

# Current Position

```text
Foundation             ██████████ 100%
Data Modeling          ██████████ 100%
Authentication         ██████████ 100%
Authorization          ██████████ 100%

Ticket CRUD             ███████░░░  70%  (built, untested)
Assignment              ███████░░░  70%  (built, one open decision)
Lifecycle               ███████░░░  70%  (built, untested — highest risk)
Messages                ███████░░░  70%  (built, untested)
Audit                   █████░░░░░  50%  (partial — archive/priority events unwired)
SLA                     ███████░░░  70%  (built, sweep job just wired, untested)
Queue/Search            ███████░░░  70%  (built, untested)
Bulk Operations         ███████░░░  70%  (built, untested)
CSV                     ███████░░░  70%  (built, untested)
Dashboard               ███████░░░  70%  (built, untested)

React UI                ░░░░░░░░░░   0%
Testing                 ██░░░░░░░░  20%  (only auth/access verified)
Deployment              ░░░░░░░░░░   0%
```