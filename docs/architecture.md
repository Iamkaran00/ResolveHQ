# Architecture — ResolveHQ

## Overview

ResolveHQ is a shared support-ticket queue for an internal team of agents and a supervisor. It's
built as a two-piece MERN application: a React single-page app and a Node/Express REST API, with
MongoDB as the only datastore. There is no third service, no message queue, no external
integration — the brief scopes this to an internal workspace, and everything here is sized to
that scope rather than padded to look bigger than it is.

---

## 1. What are the moving pieces, and how do they talk to each other?

```
┌──────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                 │
│                                                            │
│   Redux store: auth · ticket · alert · dashboard slices   │
│   React Router: /login /tickets /tickets/:id /alerts ...  │
│   Mantine UI + react-hook-form + Framer Motion            │
└───────────────────────────┬────────────────────────────────┘
                            │  HTTPS, JSON
                            │  Axios (withCredentials: true)
                            │  Auth carried as an HttpOnly cookie
                            ▼
┌──────────────────────────────────────────────────────────┐
│              Express API  (Node.js, ES Modules)           │
│                                                            │
│   /api/v1/auth      signup · login · logout · me          │
│   /api/v1/tickets   CRUD · lifecycle · reassign ·          │
│                     collaborators · replies · timeline ·   │
│                     bulk actions · CSV export · dashboard  │
│   /api/v1/alerts    list · acknowledge                     │
│                                                            │
│   Middleware pipeline (every request, in order):           │
│   cors → cookieParser → express.json → authenticate        │
│        → requireRole  |  loadTicket + requireTicketAccess  │
│        → controller                                        │
│                                                            │
│   Services (logic shared across more than one controller): │
│     ticketLifecycle.service.js  — state machine, clock      │
│     slaAlert.service.js         — breach/at-risk evaluation │
│                                                            │
│   Background: setInterval sweep, every 60s, inside the      │
│   same process — walks tickets in a running state (New/     │
│   Open) and evaluates each one for SLA breach               │
└───────────────────────────┬────────────────────────────────┘
                            │  Mongoose
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    MongoDB (Atlas, M0)                     │
│   User · Ticket · Message · TimelineEvent (+9 discriminator │
│   subtypes) · SLAAlert                                      │
└──────────────────────────────────────────────────────────┘
```

The frontend never touches the database directly — every read or write is a JSON request to the
API, and the API is the only thing holding a Mongoose connection. Inside the API, every request
passes through the same fixed pipeline before it reaches a controller. `authenticate` verifies
the JWT from an HttpOnly cookie and loads the *current* User document from the database rather
than trusting the token's payload — so a role change (agent promoted to supervisor, say) takes
effect on the very next request instead of waiting out the token's lifetime. After that,
authorization splits into two different tools depending on what the route actually needs:
`requireRole` is a blunt yes/no gate used only where a route has no per-ticket nuance at all (the
dashboard is supervisor-only, full stop); `loadTicket` + `requireTicketAccess` is the finer-grained
pair used on almost every ticket route, since "can this user touch this ticket" depends on the
specific ticket, not just the role — an agent passes if they're the primary assignee or a
collaborator, a supervisor always passes.

Two pieces of logic got pulled into their own service files instead of living inside a
controller, and the test for which ones did was reuse, not tidiness: `ticketLifecycle.service.js`
holds the status transition rules and the response-clock math because it's called from the status
route, from bulk-close, and from the reply-auto-resume path; `slaAlert.service.js` holds the
breach/at-risk evaluation because it's called from both the sweep and, optionally, right after a
status change for immediate feedback. Everything else — ticket CRUD, the reassignment rule,
collaborators, search and filtering, bulk actions, CSV export — sits directly in the controller
that uses it, since none of it is called from more than one place, and wrapping it in a service
anyway would just be an extra file to keep in sync for no functional benefit.

---

## 2. Where does each piece run?

| Piece | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Static SPA build; environment variable points at the deployed API URL |
| Backend | Render | Free tier; cold start after idling can take up to ~60s |
| Database | MongoDB Atlas (M0, free) | Atlas's free tier runs as a replica set — relevant if transactions are ever added, since a bare local `mongod` doesn't support them |
| SLA sweep | Inside the Render backend process | Not a separate deployment — a `setInterval` started once the DB connection resolves. It only runs while that process is alive, so if Render spins the instance down after idling, the sweep pauses until a request wakes it back up. A real, accepted limitation of running it in-process rather than as an independent scheduled job. |

---

## 3. What is the request path for one representative user action, end to end?

Reassigning a ticket — chosen because it's the one rule the brief names explicitly: *"agents
cannot reassign a ticket away from themselves."*

```
Agent clicks "Reassign" in TicketDetail, picks a target agent, confirms
   │
   ▼
Frontend:  dispatch(reassignTicket(id, newAssigneeId))
   │
   ▼
Axios:  PATCH /api/v1/tickets/:id/reassign   { newAssigneeId }
        (HttpOnly cookie carries the JWT automatically)
   │
   ▼
Express:  cors → cookieParser → express.json
   │
   ▼
authenticate
   – verify JWT, fetch the live User document, set req.user
   │
   ▼
loadTicket
   – Ticket.findById(:id); 404 early if it doesn't exist; set req.ticket
   │
   ▼
requireTicketAccess
   – supervisor bypasses this entirely
   – agent must be the ticket's current primary assignee or a collaborator,
    otherwise 403
   │
   ▼
reassignTicket controller
   – if requester is an agent AND is the current primary assignee AND the
    target isn't themselves → reject, 403, "cannot reassign away from
    themselves"
   – if requester is a supervisor → no restriction at all
   – write an AssignmentEvent to the timeline (oldAssignee, newAssignee, actor)
   – update Ticket.primaryAssignee, save
   – re-populate primaryAssignee + collaborators before responding
   │
   ▼
Response:  { success: true, ticket }
   │
   ▼
Redux:  setCurrentTicket(ticket)
   – TicketDetail re-renders the new assignee's name immediately,
    no reload needed
```

The populate step at the end was a real bug caught during development, not a hypothetical I'm
including for effect: the first version saved the ticket and returned it as-is, so
`primaryAssignee` came back as a bare ObjectId string. The frontend had no name to render until a
full page reload happened to trigger a *different* route that did populate correctly. It's the
clearest example from this project of why "the request succeeded" and "the response actually
gave the caller what it needed" are two separate things worth checking independently — a 200
status code isn't proof the feature works.

---

## 4. What did I decide not to build, and why?

- **A customer-facing portal or customer accounts.** The ten required goals describe an internal
  agent/supervisor workspace; the "customer" is contact information embedded directly on the
  ticket, never a system user with their own login. A customer portal would be real,
  unrequested scope with no goal in the brief to justify it.
- **OTP or email verification on signup.** Not asked for, and the usual reason it earns its cost
  — locking down who can create an account — doesn't really apply here, since the one privileged
  role (supervisor) is never created through public signup at all; it's seeded separately.
- **Google or social login.** The brief only asks for email-and-password. OAuth adds real
  deployment risk for no corresponding requirement — redirect URLs silently breaking between
  localhost and a production domain is a classic last-day failure, and there was nothing to gain
  from it here.
- **Real-time delivery (WebSockets) for SLA alerts.** A 60-second polling sweep is simpler to
  reason about, easier to debug, and sufficient at this scale. The brief requires alerts to
  *appear*, not to appear instantly.
- **Database transactions around multi-document writes** — a status change and its timeline
  event, for instance, are two separate writes with no atomicity between them today. Mongo
  transactions need a replica set, which Atlas's free tier happens to provide but which isn't a
  given in every environment; for this project's scope, the small inconsistency window during a
  crash between those two writes is an accepted, named risk rather than something engineered
  around from day one.
- **Compound indexes on the Ticket collection.** Deliberately deferred until real query patterns
  existed to justify them, rather than added speculatively up front — the specific indexes I'd
  add first, and why, are in `schema.md`'s answer to what breaks at 100x the data.
