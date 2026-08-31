# ResolveHQ Development Plan

## Project Goal

Build a complete customer-support operations workspace that satisfies the ten core goals of the assessment while maintaining a clear development history and documented engineering decisions.

The assessment explicitly emphasizes incremental development, reasoning, trade-offs, and Git history rather than treating the final application as the only deliverable.

---

# Phase 1: Foundation

## Status: Completed / In Progress

### Completed

* Repository initialized
* GitHub repository created
* Backend initialized with Node.js
* Express configured
* Environment configuration started
* MongoDB connection established
* Basic server created
* Development script configured with Nodemon
* Backend folder structure established

---

# Phase 2: Initial Data Modeling

## Status: Completed

### User Model

Implemented:

* name
* email
* passwordHash
* role
* timestamps

Roles:

```text
agent
supervisor
```

### Ticket Model

Implemented:

* subject
* description
* requester
* priority
* category
* status
* primaryAssignee
* collaborators
* archive state
* SLA target
* SLA clock
* closedAt
* timestamps

The initial schema was intentionally simplified after reviewing a more complex proposed design.

---

# Phase 3: Authentication

## Status: Implementing

### Completed / Built

* bcrypt password hashing
* JWT generation
* JWT stored in HttpOnly cookie
* Login flow
* Signup flow
* Logout flow
* Authentication middleware
* Role information included in JWT
* Initial Agent/Supervisor authorization middleware

Current authentication flow:

```text
Signup/Login
     ↓
bcrypt
     ↓
JWT
     ↓
HttpOnly cookie
     ↓
auth middleware
     ↓
req.user
```

### Remaining

* Test complete auth flow
* Add protected test endpoint
* Verify invalid token behavior
* Verify expired token behavior
* Verify Agent/Supervisor authorization behavior
* Add demo users/seed data

---

# Phase 4: Ticket CRUD

## Planned

Implement:

* Create ticket
* List tickets
* View ticket
* Update ticket
* Archive ticket
* Restore ticket

---

# Phase 5: Ticket Assignment

## Planned

Implement:

* Primary assignment
* Reassignment
* Collaborators
* Add collaborator
* Remove collaborator
* Permission enforcement

Important business rule:

Assignment permissions must be enforced by the backend rather than relying only on the React interface.

---

# Phase 6: Ticket Lifecycle

## Planned

Implement:

```text
NEW
 ↓
OPEN
 ↓
PENDING
 ↓
OPEN
 ↓
RESOLVED
 ↓
CLOSED
```

Also implement valid reopening behavior.

Invalid transitions must be rejected by the server.

The lifecycle is a business rule and therefore should be implemented in the service layer rather than relying only on Mongoose enum validation.

---

# Phase 7: Replies and Internal Notes

## Planned

Implement:

* Customer-visible replies
* Internal notes
* Message history
* Author information
* Timestamps
* Internal-note visibility enforcement

The Message model will be added when this feature is implemented.

---

# Phase 8: Audit Timeline

## Planned

Record meaningful ticket changes such as:

* Ticket creation
* Status changes
* Assignment
* Reassignment
* Collaborator changes
* Replies
* Internal notes
* Archive/restore
* Other important mutations

Every event should identify:

```text
what
who
when
```

Audit history should be append-only.

---

# Phase 9: SLA Tracking

## Planned

Implement:

* Priority-based SLA targets
* Response clock
* Pending pause
* Resume behavior
* At-risk detection
* Breach detection
* Alert creation
* Alert acknowledgement
* Repeat breach after reopening

The Ticket schema already contains the initial SLA state required for this implementation.

---

# Phase 10: Queue and Search

## Planned

Implement server-side:

* Text search
* Status filtering
* Priority filtering
* Category filtering
* Assignee filtering
* Sorting
* Pagination
* My Work
* Unassigned
* SLA attention

The React client should not load the entire ticket dataset and perform all filtering locally.

---

# Phase 11: Bulk Operations

## Planned

Implement:

* Bulk reassign
* Bulk close

The API should support partial success.

Example:

```json
{
    "successful": [
        "ticket-1",
        "ticket-2"
    ],
    "failed": [
        {
            "ticket": "ticket-3",
            "reason": "Permission denied"
        }
    ]
}
```

---

# Phase 12: CSV Export

## Planned

Implement CSV export based on the currently filtered ticket set.

The export should respect relevant:

* Search
* Filters
* Sorting
* Query parameters

---

# Phase 13: Dashboard

## Planned

Create dashboard metrics for:

* Open tickets
* Pending tickets
* Resolved tickets
* Closed tickets
* SLA at-risk tickets
* SLA breached tickets
* Agent workload

---

# Phase 14: React Frontend

## Planned

Build:

```text
Login
  ↓
Queue
  ↓
Ticket Detail
  ↓
Conversation
  ↓
Assignment
  ↓
Collaborators
  ↓
Audit Timeline
  ↓
SLA Alerts
  ↓
Dashboard
```

The interface should prioritize clarity and fast ticket handling.

---

# Phase 15: Testing

## Planned

Focus testing on business-critical behavior:

### Authentication

* Valid login
* Invalid password
* Missing token
* Invalid token
* Logout

### Authorization

* Agent permissions
* Supervisor permissions
* Unauthorized operation

### Ticket Lifecycle

* Valid transitions
* Invalid transitions
* Reopening

### SLA

* Clock start
* Pending pause
* Resume
* At-risk
* Breach
* Repeat breach

### Audit

* Creation of expected audit events
* Correct actor
* Correct timestamp
* Append-only behavior

---

# Phase 16: Deployment

## Planned

* Deploy backend
* Deploy React frontend
* Configure MongoDB
* Configure environment variables
* Verify production CORS
* Verify authentication cookies
* Seed demo data
* Test live application

The assessment requires a reachable live application with demo data and credentials.

---

# Phase 17: Final Submission

## Planned

Before submission:

* README completed
* SUBMISSION.md completed
* Five documentation files completed
* Git history reviewed
* AI prompt history reviewed
* Demo accounts verified
* Live URL verified
* API verified
* Frontend verified
* Final requirement checklist completed

---

# Development Workflow

Each significant feature should follow:

```text
Understand requirement
        ↓
Design
        ↓
Record important decision
        ↓
Implement
        ↓
Test
        ↓
Update documentation
        ↓
Meaningful Git commit
```

This is intentionally aligned with the assessment's requirement for incremental Git history and documentation throughout development.

---

# Current Position

```text
Foundation             ██████████ 100%
Data Modeling          ██████████ 100%
Authentication         ███████░░░  70%
Authorization          ████░░░░░░  40%

Ticket CRUD            ░░░░░░░░░░   0%
Lifecycle              ░░░░░░░░░░   0%
Messages               ░░░░░░░░░░   0%
Audit                  ░░░░░░░░░░   0%
SLA                    ░░░░░░░░░░   0%
Queue/Search           ░░░░░░░░░░   0%
Bulk Operations        ░░░░░░░░░░   0%
CSV                    ░░░░░░░░░░   0%
Dashboard              ░░░░░░░░░░   0%
React UI               ░░░░░░░░░░   0%
Testing                ░░░░░░░░░░   0%
Deployment             ░░░░░░░░░░   0%
```

This progress representation is a working snapshot and should be updated as implementation continues.
