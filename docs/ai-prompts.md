# AI Usage Log

AI was used selectively during the early design and research phase of ResolveHQ.

The primary use of AI was to research the problem domain, evaluate database design strategies, and review the Ticket data model before implementation.

AI was used as a design/research assistant. Final decisions were reviewed and adapted based on the actual requirements of the project.

---

## 1. Project Research

### Purpose

AI was used to research and understand the requirements of the support-ticketing domain before implementation.

### Prompt

> I have this customer support ticketing assessment. Research the requirements carefully and help me understand what I actually need to build, the important domain concepts, the expected ticket lifecycle, roles, SLA behavior, audit requirements, and the major architectural considerations.

### How the output was used

The research helped identify the major areas that needed to be designed before implementation:

* Agent and Supervisor roles
* Ticket lifecycle
* Assignment and collaboration
* Customer-visible replies
* Internal notes
* Audit history
* SLA tracking
* Queue/search/filtering
* Bulk operations
* Dashboard requirements

The research was used to create the initial development plan and identify which parts of the system needed explicit architectural decisions.

---

## 2. Database Design Strategy

### Purpose

AI was used to compare database modeling strategies before committing to the persistence layer.

### Prompt

> For this customer support ticketing system, compare MongoDB and PostgreSQL from a database-design perspective. Consider tickets, users, messages, audit history, SLA tracking, relationships, querying, scalability, and the requirements of the assessment. Explain the trade-offs rather than simply recommending one.

### Decision

MongoDB with Mongoose was selected.

### Reasoning

The application has a central Ticket entity containing relatively small pieces of closely related state:

* status
* priority
* category
* assignment
* collaborators
* SLA clock
* archive state

Other entities such as messages and audit events can grow independently.

MongoDB provides a flexible document model while Mongoose provides schema structure and validation.

PostgreSQL remained a reasonable alternative, but MongoDB was selected because it fit the chosen MERN stack and the current domain model.

### Developer involvement

The database decision was not accepted solely from the AI recommendation. The proposed trade-offs were considered against the actual requirements before the database was selected.

---

## 3. Ticket Data Modeling

### Purpose

AI was used to explore how the central Ticket entity should be modeled.

### Prompt

> Design a detailed MongoDB/Mongoose data model for the ticketing system. Consider the requester, priority, category, lifecycle status, primary assignee, collaborators, SLA target, SLA clock, archive state, and closed state. Explain which data should be embedded and which should be referenced, and explain the reasoning behind each decision.

### Initial exploration

The initial design exploration considered:

* Ticket fields
* User references
* Collaborators
* SLA state
* Requester representation
* Indexing
* Schema-level validation

The purpose was to identify potential modeling issues before implementation.

---

## 4. Ticket Schema Review and Simplification

### Purpose

The first proposed Ticket design was intentionally challenged rather than accepted directly.

### Prompt

> The schema I feel is not satisfying. Do a detailed review of the MongoDB/Mongoose model and explain whether the fields, relationships, indexes, and validation strategy actually make sense for this project.

### Result

The review produced a more detailed design, including additional indexes and schema-level logic.

After reviewing it, I decided that some of the complexity was premature.

### Changes made

The final initial Ticket model was simplified by:

* Removing speculative indexes
* Removing unnecessary schema-level business logic
* Allowing zero collaborators
* Making the primary assignee optional
* Keeping the SLA clock representation simple
* Keeping requester information embedded
* Keeping only fields justified by the current requirements

### Reason

The goal was to create a model that was simple enough to understand and maintain while still supporting the required functionality.

Database optimization will be revisited after the actual API query patterns are implemented.

---

## 5. Embedding vs Referencing

### Design question

The Ticket model required a decision about which information should live directly inside the Ticket document and which information should reference other collections.

### Final decisions

#### Requester: Embedded

```text
Ticket
└── requester
    ├── name
    └── email
```

The requester is currently embedded because the assessment does not require a customer account/authentication system.

#### Primary Assignee: Reference

```text
Ticket.primaryAssignee → User
```

The assignee is an independent internal user and therefore is represented through a reference.

#### Collaborators: References

```text
Ticket.collaborators[] → User
```

Multiple internal users can collaborate on the same ticket.

#### SLA Clock: Embedded

```text
Ticket
└── clock
    ├── accumulatedMs
    └── pendingSince
```

The SLA clock is small and tightly coupled to the current Ticket state.

#### Messages: Separate Collection

Messages will be stored separately because conversation history can grow independently.

#### Audit Events: Separate Collection

Audit events will be stored separately because historical events can grow independently and should behave as append-only records.

---

## 6. SLA Data Modeling

### Purpose

AI research was used to explore how response-time SLA information could be represented without creating unnecessary complexity.

### Prompt

> For a support ticket system with response SLAs, design a simple data model that supports an SLA target per ticket, pausing the response clock while Pending, resuming it afterward, detecting at-risk and breached tickets, and supporting a later breach after reopening. Explain what state needs to be persisted versus what can be calculated.

### Final approach

The Ticket stores:

```text
slaTargetMinutes
clock.accumulatedMs
clock.pendingSince
```

The SLA state is kept small and associated with the Ticket.

Derived values such as whether a ticket is currently at risk or breached should be calculated by application logic rather than unnecessarily duplicating every derived state inside the Ticket document.

---

## 7. AI Output That Was Intentionally Rejected

One of the useful outcomes of the AI-assisted design process was identifying when a technically valid proposal was unnecessarily complex for the project.

The initial Ticket proposal included indexes and additional schema-level logic before the actual API access patterns had been established.

I rejected that direction.

The final implementation intentionally starts with a simpler schema and postpones optimization decisions until the real queries exist.

This reinforced an important development principle for the project:

> Design for the current requirements first, then optimize based on actual access patterns and evidence.

---

## 8. How AI Was Used

The AI was primarily used for:

```text
Project research
      ↓
Database design exploration
      ↓
Schema alternatives
      ↓
Trade-off analysis
      ↓
Developer decision
      ↓
Implementation
```

The final database and architecture decisions were reviewed against the assessment requirements and the implementation needs of ResolveHQ.

AI output was treated as input to the design process rather than as the final authority.

---

## 9. Current Outcome

The initial database design currently contains:

```text
User
Ticket
```

with the following planned supporting entities:

```text
Message
AuditEvent
SLAAlert
```

The remaining models will be introduced when their corresponding features are implemented.

This keeps the implementation incremental and avoids creating unused infrastructure before it is needed.
