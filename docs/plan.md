# Plan — ResolveHQ

## How I split the work into sessions

**Session 1 — Foundation.** Repo setup, Express skeleton, MongoDB connection, and the first pass
at the `User` and `Ticket` schemas. I deliberately kept this pass simple — no indexes, no
business-logic validation baked into Mongoose — since I didn't have real query patterns yet to
justify anything more.

**Session 2 — Auth and access control.** Signup/login/logout with bcrypt and a JWT in an
HttpOnly cookie, then the two pieces of middleware everything else depends on:
`authenticate` (who is this) and the `loadTicket` + `requireTicketAccess` pair (can this specific
user touch this specific ticket). I built ticket create/list/get/update/archive/restore and the
reassignment rule in the same session, since reassignment is really just goal 1's permission
rule applied to a specific action.

**Session 3 — Lifecycle and the SLA clock.** This is where the schema actually changed mid-build:
my first clock design used a single `pendingSince` field, and I replaced it with
`{ accumulatedMs, runningSince }` once I realized a ticket needed its clock to pause in more than
one state (Pending, Resolved, *and* Closed), not just Pending — a single "when did Pending start"
field couldn't express that. Replies, the Pending→Open auto-resume tied to a customer-visible
reply, and collaborators were built in this session too, since collaborators and the reassignment
rule share the same "who's allowed to touch this ticket" logic.

**Session 4 — The rest of the ten goals in one push.** Search/filter/sort/pagination, bulk
reassign/close, the CSV export, the timeline (built on Mongoose discriminators, one base schema
plus nine typed subtypes), SLA alerts with a periodic sweep job, and the supervisor dashboard.
This was the highest-bug-density session of the project — several real, confirmed bugs came out
of testing here rather than code review: a route-ordering bug where `/bulk/reassign` and
`/export` were being shadowed by `/:id` routes declared earlier in the file, a permission check
missing its comparison operator (`ticket.collaborators.some(c => c.toString())` instead of
`=== userId`, which let any agent into any ticket), and a couple of `.model.js` vs `.models.js`
filename mismatches that caused edits to silently land in a file nothing actually imported.

**Session 5 — Frontend, and the final bug-fix pass.** Built the whole client in one long push —
auth pages, the ticket queue, ticket detail, dashboard, alerts — and, in the same session, found
and fixed a real "assignee doesn't update without a reload" bug: several controllers
(`reassignTicket`, `addCollaborator`, `removeCollaborator`, `updateTicket`) were saving the
ticket and returning it without re-populating `primaryAssignee`/`collaborators`, so the frontend
had a raw ObjectId where it needed a name. Also closed two real goal-6/goal-7 gaps found by
re-reading the brief against the built UI: no assignee filter in the queue (goal 6 lists it
explicitly), and bulk-action results only showing a success count instead of the per-ticket
reason for each failure (goal 7 requires exactly that).

## What order I built in, and why

Auth and access control came first because almost everything else is gated by it — there's no
point building ticket search if there's no `req.user` to scope it by yet. Lifecycle and the SLA
clock came before search/bulk/dashboard because several of those later features *read* clock and
status state (the dashboard's breach count, the alerts sweep) — building them against a
half-finished clock model would have meant redoing them once the clock design settled. The
timeline came late relative to lifecycle/replies/reassignment because it only had something to
show once those actions actually existed to log.

## What I estimated versus what it actually took

The brief suggests roughly 12 hours across a week. The backend alone ran well past that,
mostly for one specific reason: a recurring `ticket.model.js` vs `ticket.models.js` naming
inconsistency across the project caused several rounds of "I fixed this bug, but it's still
happening" — the fix was landing in a file that wasn't the one actually being imported. That
class of bug cost far more real time than any single feature did, and it's the concrete reason
I'd now budget real time up front for a five-minute "does every import path match an actual
filename" pass before writing any logic, rather than discovering the mismatch one crash at a
time. Frontend and the final documentation pass both happened compressed into the last day, later
than I'd have liked — a more even split across the week would have meant less pressure at the end,
but the ten backend goals being solid first meant the frontend work was mostly straightforward
wiring rather than debugging business logic a second time.

## What I cut when I ran short

- **None of the stretch ideas** (canned responses, CSAT rating, a public status page, tagging,
  a knowledge base, auto-routing, ticket merging, priority-varying SLA policies, an email
  digest) — the brief is explicit that these don't substitute for the ten required goals, and
  with time tight, finishing the required ten solidly took priority over any of these.
- **Self-claim for unassigned tickets.** Right now only a supervisor can assign an unassigned
  ticket to an agent; an agent has no "claim this for myself" action. The brief doesn't require
  it either way, so I left it out and documented the choice rather than build it under time
  pressure.
- **Inline editing of priority/category in the ticket detail screen.** The backend supports
  changing both (and logs priority changes to the timeline), but the UI's inline-edit only
  covers subject and description. The brief just says tickets can be "edited later" without
  specifying which fields, so I treated this as optional polish rather than a gap.
- **Real-time delivery for SLA alerts.** A 60-second polling sweep does the job the brief
  actually asks for; building WebSocket-based push notifications would have been a meaningful
  time investment for a requirement ("alerts appear") that doesn't call for instant delivery.
- **Tightening the collaborator-reassignment rule.** As built, a collaborator who isn't the
  primary assignee can currently reassign a ticket between two *other* agents with no
  restriction — only the primary assignee is blocked from handing the ticket away. This is a
  genuinely ambiguous reading of the brief's wording, and rather than guess under time pressure
  I documented it as an accepted interpretation instead of changing the behavior.
