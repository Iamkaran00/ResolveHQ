# ResolveHQ Architecture

## 1. Project Overview

ResolveHQ is a customer-support operations workspace for internal support teams.

The system is designed around a shared ticket queue where Agents and Supervisors can manage customer tickets, communicate through replies and internal notes, assign work, collaborate, track ticket lifecycle, monitor response SLAs, and maintain an audit history.

The application is being built using the MERN stack:

* React
* Node.js
* Express
* MongoDB
* Mongoose

Authentication uses:

* bcryptjs for password hashing
* JWT for authentication tokens
* HttpOnly cookies for storing the JWT

---

## 2. Current Architecture

```text
                    React Frontend
                         |
                         | HTTP / JSON
                         |
                         v
                 Express REST API
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
         Middleware   Controllers   Routes
             |
             | Authentication / Authorization
             v
                     Services
             |
             v
                    Mongoose
             |
             v
                    MongoDB
```

The backend is being designed as a modular monolith rather than a collection of microservices.

---

## 3. Backend Responsibilities

### Routes

Routes define the public API endpoints.

Examples:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout

GET /api/tickets
POST /api/tickets
GET /api/tickets/:id
PATCH /api/tickets/:id/status
```

Routes should remain lightweight and delegate work to controllers and services.

---

## 4. Middleware

Middleware handles concerns that apply across multiple routes.

Current authentication middleware:

```text
auth
```

It:

1. Reads the JWT from the HttpOnly cookie.
2. Verifies the token.
3. Stores the decoded user information in `req.user`.
4. Allows the request to continue.

Authorization middleware will use the user's role to protect role-specific operations.

The intended roles are:

```text
agent
supervisor
```

Authentication and authorization are intentionally separate concepts.

```text
Authentication
"Who are you?"

Authorization
"What are you allowed to do?"
```

The assessment requires server-side enforcement of role-based behavior, so frontend-only permission checks will not be treated as security boundaries.

---

## 5. Authentication Flow

```text
User
 |
 | email + password
 v
Login Controller
 |
 v
Find User
 |
 v
bcrypt.compare()
 |
 | valid
 v
Generate JWT
 |
 v
HttpOnly Cookie
 |
 v
Browser
```

For subsequent protected requests:

```text
Browser
 |
 | Cookie: token
 v
auth middleware
 |
 v
jwt.verify()
 |
 v
req.user
 |
 v
protected controller
```

The JWT currently contains:

```js
{
    id: user._id,
    role: user.role
}
```

---

## 6. Controller Responsibility

Controllers handle HTTP-level concerns:

* Read request data
* Validate basic required input
* Call the appropriate business logic
* Return HTTP responses

Controllers should not contain large amounts of domain logic.

For example, ticket lifecycle rules should not be implemented directly inside a route handler.

---

## 7. Service Layer

The application will use services for business rules as the feature set grows.

Planned services include:

```text
auth.service.js
ticket.service.js
sla.service.js
audit.service.js
```

The service layer will be responsible for rules such as:

* Valid ticket state transitions
* Assignment permissions
* Collaborator rules
* SLA calculations
* Audit event creation

This keeps the business rules independent of Express.

---

## 8. Representative Request Flow

Example: assigning a ticket.

```text
React
 |
 | PATCH /api/tickets/:id/assign
 v
Express Route
 |
 v
Authentication Middleware
 |
 | Is JWT valid?
 v
Authorization Middleware
 |
 | Is user a supervisor?
 v
Ticket Controller
 |
 v
Ticket Service
 |
 +-- Validate ticket
 +-- Validate assignment
 +-- Update primary assignee
 +-- Create audit event
 |
 v
MongoDB
 |
 v
Response
 |
 v
React
```

The server remains responsible for determining whether the operation is permitted.

---

## 9. Current Data Models

Implemented:

```text
User
Ticket
```

Planned:

```text
Message
AuditEvent
SLAAlert
```

The planned models will be introduced when their corresponding features are implemented rather than creating unused infrastructure prematurely.

---

## 10. Current Backend Structure

```text
server/
│
├── config/
│   └── db.js
│
├── controllers/
│   └── auth.controller.js
│
├── middleware/
│   └── auth.middleware.js
│
├── models/
│   ├── User.model.js
│   └── Ticket.model.js
│
├── routes/
│   └── auth.routes.js
│
├── services/
│
├── utils/
│
├── index.js
├── .env
├── .env.example
├── .gitignore
└── package.json
```

The structure will grow as additional features are implemented.

---

## 11. Database Architecture

MongoDB is the persistence layer.

Mongoose is used as the ODM and provides:

* Schema definitions
* Validation
* References between entities
* Model APIs

The current design keeps small, tightly coupled state inside Ticket while independently growing entities such as messages and audit events will be stored separately.

---

## 12. What Is Intentionally Not Being Built

The current scope intentionally does not include:

* Customer authentication
* Customer-facing portal
* OTP verification
* Email verification
* OAuth/social login
* Microservices
* Real-time WebSocket infrastructure
* External CRM integrations
* Complex notification infrastructure

These are not required to satisfy the core assessment and would add complexity without improving the primary ticket-management workflow.

---

## 13. Architectural Principle

The project follows:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
Database
```

The goal is not to maximize the number of layers.

The goal is to give each layer one clear responsibility and keep business rules testable and understandable.
