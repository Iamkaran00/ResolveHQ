# ResolveHQ Database Schema

## 1. Database Choice

ResolveHQ uses:

```text
MongoDB
+
Mongoose
```

The database design is centered around the Ticket entity and the internal User entity.

The current implementation intentionally keeps the schema simple and avoids premature optimization.

---

# 2. User Model

The User model represents internal support staff.

## Fields

| Field        | Type   |  Required | Purpose               |
| ------------ | ------ | --------: | --------------------- |
| name         | String |       Yes | User's display name   |
| email        | String |       Yes | Login identity        |
| passwordHash | String |       Yes | Hashed password       |
| role         | String |       Yes | Internal user role    |
| createdAt    | Date   | Automatic | Creation timestamp    |
| updatedAt    | Date   | Automatic | Last update timestamp |

## Roles

```text
agent
supervisor
```

The system uses these two internal roles for role-based authorization.

---

# 3. Password Storage

Passwords are never intended to be stored as plaintext.

During registration:

```text
Plain password
      ↓
bcrypt.hash()
      ↓
passwordHash
      ↓
MongoDB
```

During login:

```text
Entered password
      ↓
bcrypt.compare()
      ↓
Stored passwordHash
      ↓
true / false
```

The database field is named `passwordHash` to make this responsibility explicit.

---

# 4. Ticket Model

Ticket is the central domain entity.

## Fields

| Field               | Type              |  Required | Purpose                           |
| ------------------- | ----------------- | --------: | --------------------------------- |
| subject             | String            |       Yes | Ticket subject                    |
| description         | String            |       Yes | Ticket description                |
| requester           | Embedded object   |       Yes | Customer information              |
| priority            | String            |       Yes | Ticket priority                   |
| category            | String            |       Yes | Ticket category                   |
| status              | String            |        No | Current ticket state              |
| primaryAssignee     | ObjectId → User   |        No | Main responsible agent            |
| collaborators       | ObjectId[] → User |        No | Other internal collaborators      |
| archived            | Boolean           |        No | Archive state                     |
| archivedAt          | Date              |        No | Archive timestamp                 |
| slaTargetMinutes    | Number            |       Yes | SLA target associated with ticket |
| clock.accumulatedMs | Number            |        No | Accumulated paused time           |
| clock.pendingSince  | Date              |        No | Current Pending start time        |
| closedAt            | Date              |        No | Closing timestamp                 |
| createdAt           | Date              | Automatic | Creation timestamp                |
| updatedAt           | Date              | Automatic | Last update timestamp             |

---

# 5. Requester

Requester information is embedded inside Ticket.

```text
requester
├── name
└── email
```

The requester is not currently a separate authenticated User.

This is intentional because the assessment focuses on the internal support workspace rather than a customer portal.

This keeps the domain smaller and avoids introducing an unnecessary customer account system.

---

# 6. Priority

Allowed values:

```text
low
medium
high
urgent
```

These values represent the ticket priority levels.

---

# 7. Category

Current categories:

```text
billing
technical
account
general
```

An enum is used to prevent inconsistent category values.

For example, the database should not end up with several representations of the same category:

```text
billing
Billing
BILLING
```

---

# 8. Status

Allowed values:

```text
new
open
pending
resolved
closed
```

The schema validates that the value is one of the supported states.

The schema does not attempt to implement the complete lifecycle.

Lifecycle rules belong to the application/service layer.

Conceptually:

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

Reopening and invalid transitions will be enforced by server-side business logic.

---

# 9. Primary Assignee

```text
Ticket.primaryAssignee
        ↓
      User
```

The field is optional because a newly created ticket may initially be unassigned.

The primary assignee represents the main person responsible for the ticket.

---

# 10. Collaborators

```text
Ticket.collaborators[]
        ↓
      User
```

A ticket can have zero or more collaborators.

Example:

```text
primaryAssignee = Agent A

collaborators = [
    Agent B,
    Agent C
]
```

Collaborators are separate from the primary assignee because they represent additional people working on the ticket.

---

# 11. Archive State

The Ticket contains:

```text
archived
archivedAt
```

`archived` represents the current state.

`archivedAt` records when the ticket was archived.

This allows tickets to be removed from normal queue views without deleting historical data.

---

# 12. SLA Data

Each Ticket stores:

```text
slaTargetMinutes
clock
├── accumulatedMs
└── pendingSince
```

### `slaTargetMinutes`

The SLA target is stored on the ticket instead of being recalculated from the current priority policy every time.

This acts as a snapshot of the target associated with that ticket.

### `accumulatedMs`

Stores previously accumulated paused time.

### `pendingSince`

Stores the beginning of the current Pending period.

The intended behavior is:

```text
OPEN
  |
  | clock running
  v
PENDING
  |
  | clock paused
  v
OPEN
  |
  | clock resumes
  v
...
```

---

# 13. Closed Timestamp

```text
closedAt
```

When a ticket becomes closed, this field records the closing time.

When reopening behavior requires the ticket to become active again, the application can clear this value.

---

# 14. Planned Message Model

The Message model will be introduced when reply functionality is implemented.

Conceptually:

```text
Message
├── ticket
├── author
├── body
├── type
└── timestamps
```

Message types will distinguish between:

```text
reply
internal_note
```

Replies are customer-visible.

Internal notes are restricted to internal staff.

---

# 15. Planned AuditEvent Model

The audit model will represent immutable historical actions.

Conceptually:

```text
AuditEvent
├── ticket
├── actor
├── action
├── metadata
└── createdAt
```

Example:

```json
{
    "action": "STATUS_CHANGED",
    "metadata": {
        "from": "open",
        "to": "pending"
    }
}
```

The timeline should allow the application to explain:

```text
What changed?
Who changed it?
When did it change?
```

---

# 16. Planned SLAAlert Model

SLA alerts will be stored separately because a ticket may have multiple alert events over its lifetime.

Conceptually:

```text
SLAAlert
├── ticket
├── type
├── status
├── triggeredAt
├── acknowledgedBy
└── acknowledgedAt
```

Possible alert types:

```text
at_risk
breached
```

---

# 17. Relationships

```text
User
 │
 ├── Ticket.primaryAssignee
 ├── Ticket.collaborators[]
 ├── Message.author
 └── AuditEvent.actor


Ticket
 │
 ├── Message
 ├── AuditEvent
 └── SLAAlert
```

Requester information remains embedded within Ticket.

---

# 18. Embedding vs Referencing

| Data             | Decision            | Reason                                    |
| ---------------- | ------------------- | ----------------------------------------- |
| Requester        | Embedded            | Small and directly associated with Ticket |
| SLA clock        | Embedded            | Small and tightly coupled with Ticket     |
| Primary assignee | Reference           | Represents an independent User            |
| Collaborators    | References          | Multiple independent Users                |
| Messages         | Separate collection | Conversation can grow independently       |
| Audit events     | Separate collection | Historical data can grow independently    |
| SLA alerts       | Separate collection | Multiple alert cycles can occur           |

---

# 19. Indexes

Indexes are intentionally not part of the initial schema.

They will be introduced after actual API query patterns are implemented.

The intended future queries include:

* Ticket queue filtering
* My Work
* Status filtering
* Priority filtering
* Category filtering
* Assignee filtering
* Sorting
* SLA-related queries

Indexes should be justified by actual access patterns rather than added speculatively.
