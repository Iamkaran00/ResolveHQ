# ResolveHQ Engineering Decisions

This document records meaningful technical decisions made during development, including alternatives considered and reasons for the final choice.

The purpose is to preserve the reasoning behind the implementation rather than merely documenting what the final code looks like.

---

## Decision 1: Use MERN

### Chosen

React + Node.js + Express + MongoDB + Mongoose.

### Why

The application is a full-stack web application with a REST API and document-oriented ticket data.

Using JavaScript across the frontend and backend also allows faster iteration during the assessment.

### Trade-off

A relational database could provide stronger relational constraints, but MongoDB is sufficient for this domain and fits the selected stack.

### Status

Current decision.

---

## Decision 2: Use MongoDB

### Chosen

MongoDB with Mongoose.

### Considered

PostgreSQL.

### Why

Ticket is the central entity and contains small pieces of tightly coupled state such as:

* priority
* status
* assignment
* SLA clock
* archive state

Meanwhile, messages, audit events, and SLA alerts can grow independently.

MongoDB provides a flexible document model while Mongoose provides schema validation and references.

### Trade-off

Some relational guarantees must be enforced by application logic rather than relying entirely on database constraints.

### Status

Current decision.

---

## Decision 3: Embed Requester in Ticket

### Chosen

Store:

```text
requester.name
requester.email
```

directly inside Ticket.

### Alternative

Create a separate Customer model.

### Why

The assessment focuses on the internal support workspace. It does not require a customer authentication system or customer portal.

A separate Customer model would add domain complexity without helping satisfy the primary requirements.

### Trade-off

Requester information can be duplicated across multiple tickets.

### Status

Current decision.

---

## Decision 4: Separate Growing Collections

### Chosen

Keep Messages, AuditEvents, and SLAAlerts separate from Ticket.

### Why

These entities can grow independently over the lifetime of a ticket.

Putting an unlimited conversation or audit history directly inside Ticket would make the central document increasingly large.

### Trade-off

Displaying a complete ticket history requires additional queries.

### Benefit

The Ticket document remains focused on current ticket state.

### Status

Current decision.

---

## Decision 5: SLA Target Stored on Ticket

### Chosen

Store:

```text
slaTargetMinutes
```

on the Ticket.

### Why

The SLA target should represent the commitment applicable to the ticket when it was created.

If the organization's priority/SLA policy changes later, existing tickets should not unexpectedly receive a different target.

### Trade-off

Existing tickets will retain their original target even after a policy change.

### Status

Current decision.

---

## Decision 6: SLA Clock Stored on Ticket

### Chosen

```text
clock.accumulatedMs
clock.pendingSince
```

### Why

The current clock state is small and directly associated with the ticket.

It supports the required behavior where the response clock pauses while a ticket is Pending and resumes afterward.

### Trade-off

Lifecycle operations must update the clock correctly.

### Status

Current decision.

---

## Decision 7: Business Rules Should Not Live Entirely in Mongoose

### Chosen

Use Mongoose for structural validation and services for business rules.

### Example

Mongoose validates:

```text
status ∈ new/open/pending/resolved/closed
```

The service validates:

```text
Is NEW → CLOSED actually allowed?
```

### Why

Schema validation and business workflow validation are different responsibilities.

This makes lifecycle behavior easier to test independently.

### Status

Current decision.

---

## Decision 8: JWT in HttpOnly Cookie

### Chosen

JWT authentication with the token stored in an HttpOnly cookie.

### Considered

JWT in localStorage.

Traditional server-side sessions were also considered conceptually.

### Why

The application already uses a REST API and JWT provides a straightforward stateless authentication mechanism.

Using an HttpOnly cookie prevents client-side JavaScript from directly reading the token.

### Trade-off

Cookie-based authentication requires appropriate CORS and CSRF considerations.

### Status

Current decision.

---

## Decision 9: No OTP

### Chosen

Do not implement OTP or email verification.

### Why

OTP is not required by the assessment.

The system is an internal support workspace with Agent and Supervisor accounts.

Adding OTP would introduce email/SMS infrastructure that does not contribute to the core assessment requirements.

### Status

Current decision.

---

## Decision 10: Authentication and Authorization Are Separate

### Chosen

Use:

```text
auth middleware
+
role-specific authorization middleware
```

### Why

Authentication answers who the user is.

Authorization answers what that user is allowed to do.

Keeping them separate allows routes to express permissions clearly.

Example:

```text
auth
isSupervisor
assignTicket
```

### Status

Current decision.

---

## Decision 11: Keep Authentication Middleware Simple

### Chosen

Read the JWT from the cookie rather than supporting multiple token locations.

### Rejected

Supporting:

* Cookie
* Request body token
* Authorization header

simultaneously.

### Why

The application deliberately chose HttpOnly-cookie authentication.

Supporting several token locations would make the authentication contract less clear.

### Status

Current decision.

---

## Decision 12: No Premature Database Indexes

### Chosen

Do not add indexes during initial schema design.

### Why

Indexes should be driven by actual query patterns.

The application will first implement queue/search/filter APIs, then indexes can be added based on the resulting queries.

### Trade-off

Some development queries may initially be less optimized.

### Status

Current decision.

---

## Decision 13: Simplify the Initial Schema

### Original Direction

An early schema proposal included more indexes and additional schema-level logic.

### Reconsideration

The design was intentionally simplified.

### Changes

* Removed initial indexes
* Removed unnecessary schema-level validation logic
* Allowed zero collaborators
* Made primary assignment optional
* Kept SLA clock state simple
* Kept requester embedded

### Why

The additional complexity did not improve the current implementation enough to justify it.

The final schema should be understandable and defensible rather than impressive-looking for its own sake.

### Status

**Reconsidered decision.**

This is an example of a design changing during development rather than being treated as fixed from the beginning.

---

## Decision 14: Do Not Allow Public Signup to Choose Supervisor Role

### Chosen

Normal signup creates an Agent.

### Why

Allowing a public request to specify:

```json
{
    "role": "supervisor"
}
```

would allow users to grant themselves elevated privileges.

Supervisor/demo accounts should instead be created through controlled seed/admin mechanisms.

### Status

Current direction.

---

## Decision 15: Modular Monolith

### Chosen

Use one backend application with separated modules.

### Alternative

Microservices.

### Why

The project is small enough that microservices would introduce more operational complexity than value.

A modular monolith provides:

* simple deployment
* straightforward debugging
* clear module boundaries
* easy local development

### Status

Current decision.
