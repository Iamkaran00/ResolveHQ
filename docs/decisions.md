# ResolveHQ Engineering Decisions

This document records meaningful technical decisions made during the development of ResolveHQ, including alternatives considered and the reasoning behind the final choices.

The purpose of this document is to preserve the engineering reasoning behind the implementation rather than merely documenting what the final code looks like.

---

## Decision 1: Use MERN

### Chosen

React + Node.js + Express + MongoDB + Mongoose.

### Why

ResolveHQ is a full-stack web application with a REST API and a document-oriented ticket management domain.

Using JavaScript across the frontend and backend allows the project to move quickly while maintaining a consistent development environment.

### Trade-off

A different backend language or relational stack could provide different strengths, but MERN is well suited to the application's requirements and development scope.

### Status

Current decision.

---

## Decision 2: Use MongoDB

### Chosen

MongoDB with Mongoose.

### Considered

PostgreSQL.

### Why

Ticket is the central domain entity and contains small pieces of tightly coupled current state such as:

* priority
* status
* assignment
* collaborators
* SLA clock
* archive state

Other entities such as messages, timeline events, and SLA alerts can grow independently over the lifetime of a ticket.

MongoDB provides a document-oriented model that works well with this structure, while Mongoose provides schema definitions, validation, and references between entities.

### Trade-off

Some relational guarantees that would naturally be expressed through database constraints must instead be handled by application-level business logic.

### Status

Current decision.

---

## Decision 3: Embed Requester in Ticket

### Chosen

Store requester information directly inside the Ticket:

```text
requester.name
requester.email
```

### Alternative Considered

Create a separate Customer model.

### Why

The assessment requires requester information but does not require a customer authentication system or customer portal.

The requester is therefore treated as ticket-specific customer information rather than as an authenticated system user.

Embedding the requester keeps the domain focused on the internal support workspace.

### Trade-off

The same requester information may be duplicated across multiple tickets.

This is acceptable because the application does not currently require customer account management or a centralized customer profile.

### Status

Current decision.

---

## Decision 4: Separate Growing Data from Ticket

### Chosen

Keep Messages, TimelineEvents, and SLAAlerts in separate collections from Ticket.

### Why

A ticket can accumulate many messages, historical events, and SLA events throughout its lifetime.

Embedding an unlimited conversation or historical timeline directly inside the Ticket document would cause the central document to grow continuously.

Separating these entities allows them to grow independently while keeping Ticket focused on the current operational state.

### Trade-off

Displaying a complete ticket history requires additional database queries.

### Benefit

The Ticket document remains focused and manageable while historical and conversational data can grow independently.

### Status

Current decision.

---

## Decision 5: Use a Single Message Model

### Chosen

Use one Message model for both customer-visible replies and internal notes.

```text
Message.type

reply
internal_note
```

### Alternative Considered

Create separate Reply and InternalNote models.

### Why

Both representations have the same fundamental structure:

```text
ticket
author
body
createdAt
```

The main difference is visibility.

Using a `type` field avoids duplicating nearly identical schemas while still allowing the application to enforce different visibility rules.

### Trade-off

The service layer must explicitly enforce that internal notes are not exposed where customer-visible replies are expected.

### Status

Current decision.

---

## Decision 6: Use TimelineEvent Instead of a Generic AuditEvent

### Chosen

Use a dedicated `TimelineEvent` model to represent historical ticket activity.

### Alternative Considered

A generic `AuditEvent` model containing:

```text
ticket
actor
action
metadata
createdAt
```

### Why

The timeline is a first-class feature of ResolveHQ.

Different ticket events naturally contain different structured information.

For example:

```text
Status change
├── oldStatus
└── newStatus

Assignment
├── oldAssignee
└── newAssignee

Priority change
├── oldPriority
└── newPriority

Reply
└── message
```

A generic `metadata` object would make these structures less explicit and would provide weaker schema-level validation.

Using TimelineEvent allows the historical model to directly represent the domain events that the application displays in the ticket timeline.

### Status

Current decision.

---

## Decision 7: Use Mongoose Discriminators for Timeline Events

### Chosen

Use Mongoose discriminators with `TimelineEvent` as the base model.

All timeline events share common fields such as:

```text
ticket
actor
createdAt
```

while individual event types define their own additional fields.

The discriminator key is:

```text
type
```

### Example Event Types

```text
TimelineEvent
├── StatusChangeEvent
├── AssignmentEvent
├── CollaboratorAddedEvent
├── CollaboratorRemovedEvent
├── ReplyEvent
├── InternalNoteEvent
├── PriorityChangeEvent
├── ArchiveEvent
└── RestoreEvent
```

### Why

Different events have genuinely different data structures.

For example, a status change needs to preserve:

```text
oldStatus
newStatus
```

while an assignment event needs:

```text
oldAssignee
newAssignee
```

and a reply event needs:

```text
message
```

Mongoose discriminators allow these event types to share a common base schema and MongoDB collection while maintaining event-specific schema definitions and validation.

### Alternative Considered

A single generic event schema containing many optional fields or an unrestricted metadata object.

### Why the Alternative Was Not Chosen

A generic structure would allow unrelated fields to appear on events and would make the actual structure of each event less explicit.

Discriminators provide stronger domain modeling while avoiding separate completely independent collections for every event type.

### Status

Current decision.

---

## Decision 8: Timeline Events Are Append-Only

### Chosen

Timeline events are treated as immutable historical records.

The application will not expose normal update or delete operations for timeline events.

### Why

A historical timeline should represent what actually happened.

If a ticket changes from:

```text
open → pending
```

the corresponding event should remain unchanged even if the ticket later moves back to:

```text
pending → open
```

The second change creates another event.

### Example

```text
StatusChangeEvent
open → pending

StatusChangeEvent
pending → open
```

Both events remain in the timeline.

### Benefit

The application can reconstruct the ticket's history without modifying historical records.

### Status

Current decision.

---

## Decision 9: Separate Current State from Historical State

### Chosen

Store current ticket state in Ticket and historical activity in TimelineEvent.

### Principle

```text
Ticket
"What is true now?"

TimelineEvent
"What happened over time?"
```

### Example

The Ticket may currently contain:

```text
status = open
primaryAssignee = Rahul
```

while the TimelineEvent collection may contain:

```text
Ticket created
Assigned to Karan
Open → Pending
Pending → Open
Reassigned to Rahul
```

### Why

The current state and historical state serve different purposes.

The Ticket must be easy to use for normal operational queries, while TimelineEvent preserves the historical sequence of actions.

### Status

Current decision.

---

## Decision 10: Store SLA Target on Ticket

### Chosen

Store:

```text
slaTargetMinutes
```

directly on Ticket.

### Why

The SLA target represents the commitment applicable to that ticket.

If the organization's priority-to-SLA policy changes later, existing tickets should not unexpectedly receive a different target.

The value therefore acts as a snapshot of the applicable SLA target.

### Trade-off

Existing tickets retain their original target even if the organization's SLA policy changes later.

### Status

Current decision.

---

## Decision 11: Store Current SLA Clock State on Ticket

### Chosen

Store:

```text
clock.accumulatedMs
clock.pendingSince
```

inside Ticket.

### Why

The current SLA clock state is small and tightly coupled to the current ticket state.

It needs to be updated when a ticket enters or leaves Pending.

### Intended Behavior

```text
OPEN
  │
  │ clock running
  ▼
PENDING
  │
  │ clock paused
  ▼
OPEN
  │
  │ clock resumes
  ▼
...
```

### Trade-off

Ticket lifecycle operations must correctly update the SLA clock.

### Status

Current decision.

---

## Decision 12: Store SLA Alerts Separately

### Chosen

Use a separate SLAAlert collection.

### Why

A ticket can experience multiple SLA events throughout its lifetime.

For example:

```text
Ticket
  ↓
At Risk
  ↓
Breached
  ↓
Resolved
  ↓
Reopened
  ↓
At Risk
  ↓
Breached
```

Storing alerts separately allows each alert cycle to be represented independently.

### Benefit

The system can maintain alert history and acknowledgement information without overloading the Ticket document.

### Status

Current decision.

---

## Decision 13: Business Rules Should Not Live Entirely in Mongoose

### Chosen

Use Mongoose for structural validation and the service/application layer for business rules.

### Example

Mongoose validates:

```text
status ∈ new/open/pending/resolved/closed
```

The service layer validates:

```text
Is NEW → CLOSED a valid transition?
```

### Why

Schema validation and business workflow validation are different responsibilities.

Mongoose should ensure that stored data has a valid structure.

Application services should determine whether an operation is valid according to the business rules.

This keeps lifecycle behavior explicit and easier to test.

### Status

Current decision.

---

## Decision 14: JWT in HttpOnly Cookie

### Chosen

Use JWT-based authentication with the JWT stored in an HttpOnly cookie.

### Considered

* JWT stored in localStorage
* Traditional server-side sessions

### Why

ResolveHQ uses a REST API and JWT provides a straightforward authentication mechanism.

The JWT contains the authenticated user's identity information and role.

The token is stored in an HttpOnly cookie so browser-side JavaScript cannot directly access the authentication token.

### Authentication Flow

```text
Login
  ↓
Validate credentials
  ↓
bcrypt.compare()
  ↓
jwt.sign()
  ↓
Set HttpOnly cookie
  ↓
Browser stores cookie
```

For protected requests:

```text
Browser
  ↓
Cookie
  ↓
auth middleware
  ↓
jwt.verify()
  ↓
req.user
  ↓
Controller
```

### Trade-off

Cookie-based authentication requires appropriate CORS configuration and consideration of CSRF protections when the application is deployed.

### Status

Current decision.

---

## Decision 15: No OTP or Email Verification

### Chosen

Do not implement OTP or email verification.

### Why

OTP and email verification are not required by the assessment.

ResolveHQ is an internal support workspace with Agent and Supervisor accounts.

Adding OTP would introduce additional email/SMS infrastructure without contributing significantly to the core ticket-management requirements.

### Status

Current decision.

---

## Decision 16: Authentication and Authorization Are Separate

### Chosen

Separate authentication middleware from role-based authorization.

### Authentication

Authentication answers:

```text
Who is this user?
```

### Authorization

Authorization answers:

```text
What is this user allowed to do?
```

### Example

```text
auth
  ↓
authorize("supervisor")
  ↓
assignTicket
```

### Why

Keeping these responsibilities separate makes protected routes easier to understand and allows different permissions to be expressed clearly.

### Status

Current decision.

---

## Decision 17: Keep Authentication Token Source Consistent

### Chosen

Read the JWT from the authentication cookie.

### Rejected

Supporting multiple token locations simultaneously:

```text
Cookie
Request body
Authorization header
```

### Why

The application deliberately chose HttpOnly-cookie authentication.

Supporting multiple token locations would create an unnecessarily broad authentication contract and make the security model harder to reason about.

The backend should have one clear authentication mechanism.

### Status

Current decision.

---

## Decision 18: Do Not Allow Public Signup to Choose Supervisor Role

### Chosen

Normal registration creates an Agent account.

Supervisor accounts should be created through a controlled mechanism such as a seed/admin process.

### Why

Allowing a public registration request to specify:

```json
{
    "role": "supervisor"
}
```

would allow users to request elevated privileges for themselves.

Role elevation must therefore be controlled by the backend.

### Status

Current direction.

---

## Decision 19: Use a Modular Monolith

### Chosen

Use one backend application with clear module boundaries.

### Alternative Considered

Microservices.

### Why

ResolveHQ is small enough that microservices would introduce operational and deployment complexity without providing meaningful benefits.

A modular monolith provides:

* simple deployment
* straightforward debugging
* clear module boundaries
* easier local development
* lower infrastructure overhead

The code can still be organized into separate responsibilities such as:

```text
auth
tickets
messages
timeline
sla
```

without requiring separate services.

### Status

Current decision.

---

## Decision 20: Delay Database Index Optimization

### Chosen

Do not add application-specific indexes during the initial schema design.

### Why

Indexes should be driven by actual database access patterns.

The application will first implement the relevant queries for:

* ticket queues
* My Work
* status filtering
* priority filtering
* category filtering
* assignee filtering
* sorting
* timeline retrieval
* SLA-related queries

Indexes can then be added based on the actual query patterns.

### Trade-off

Initial development queries may not be fully optimized.

### Benefit

The database avoids speculative indexes and keeps optimization tied to real application behavior.

### Status

Current decision.

---

## Decision 21: Reconsideration of Early Schema Complexity

### Original Direction

An earlier schema proposal included additional indexes and more schema-level validation logic.

### Reconsideration

The database design was reviewed after considering the actual application requirements and workflows.

### Changes

* Removed premature indexes.
* Removed unnecessary schema-level business validation.
* Allowed zero collaborators.
* Made primary assignment optional.
* Kept SLA clock state focused on current operational state.
* Kept requester information embedded.
* Replaced the generic AuditEvent direction with the structured TimelineEvent model.
* Added discriminator-based event types where different historical events require different data structures.

### Why

The goal is not to maximize the number of technical mechanisms in the project.

The goal is to use appropriate engineering structure where it provides genuine value.

The final schema should therefore be both understandable and robust, while still using additional structure where it improves domain modeling or system behavior.

### Status

Reconsidered decision.

---

# Day 2 Database Design Summary

The resulting domain model is:

```text
User
  │
  ├── Ticket.primaryAssignee
  ├── Ticket.collaborators[]
  ├── Message.author
  └── TimelineEvent.actor


Ticket
  │
  ├── Message
  ├── TimelineEvent
  └── SLAAlert
```

The five core models are:

```text
User
Ticket
Message
TimelineEvent
SLAAlert
```

The central design principle is:

```text
Ticket
→ current operational state

Message
→ conversation

TimelineEvent
→ historical ticket activity

SLAAlert
→ SLA alert lifecycle

User
→ authenticated internal support staff
```

This structure provides a clear separation between current state, communication, historical activity, and SLA tracking while keeping the application domain focused on the requirements of the support workspace.
