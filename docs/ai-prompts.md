# AI Prompts

## AI-Assisted Development

I used **ChatGPT and Claude** as development assistants throughout the ResolveHQ project.

AI was used for:

* Understanding and researching project requirements
* Exploring implementation approaches
* Reviewing backend schemas and controllers
* Debugging development errors
* Improving error handling
* Reviewing authorization and business logic
* Accelerating frontend development
* Improving UI/UX and styling
* Generating and refining documentation
* Reviewing completed features and identifying potential edge cases

The prompts below are representative examples of the prompts used during development. They are not intended to be a complete transcript of every AI interaction.

AI suggestions were reviewed and tested against the actual application before being accepted.

---

# 1. Project Research & Planning

### Prompt

> Read the project/assessment requirements and help me understand the ten core goals. Break them down into implementable backend and frontend requirements, identify the important constraints, and suggest a development order. Do not add unnecessary features that are not required.

### Prompt

> Based on this project requirement, help me design a high-level architecture for a MERN application. Identify the main entities, APIs, services, authorization requirements, and frontend pages that will be required.

### Prompt

> Review my planned implementation against the assessment requirements and tell me if any core requirement is missing or incorrectly interpreted.

---

# 2. MongoDB Schema & Data Modeling

### Prompt

> Review my Mongoose schemas for the ResolveHQ application. Check the fields, types, references, validation, defaults, relationships, indexes, and timestamps. Identify possible design problems and suggest improvements without unnecessarily changing the existing architecture.

### Prompt

> Review the relationship between User, Ticket, Message, TimelineEvent, and SLAAlert. Check whether the data model supports the required ticket lifecycle, assignment, collaborators, messages, audit history, and SLA tracking.

### Prompt

> Review this schema as a code reviewer. Identify anything that could cause bugs later in controllers, queries, authorization, or frontend API responses.

### Prompt

> Compare my schema design with the project requirements and identify any missing fields or unnecessary fields.

---

# 3. Backend API & Controllers

### Prompt

> Review these Express controllers for ResolveHQ. Check validation, authorization, database operations, response structure, HTTP status codes, async error handling, and edge cases. Do not rewrite everything. Point out concrete problems and suggest minimal fixes.

### Prompt

> Review this controller for bugs and potential runtime errors. Pay particular attention to null values, missing fields, invalid ObjectIds, database failures, and assumptions about req.user and req.ticket.

### Prompt

> Improve the error handling in these controllers while keeping the existing API behavior unchanged.

### Prompt

> Review this API implementation against the expected functionality and identify anything that could fail during real usage.

---

# 4. Authentication & Authorization

### Prompt

> Review my authentication and authorization implementation. Check JWT handling, HttpOnly cookies, password hashing, authentication middleware, role-based authorization, and ticket-level authorization.

### Prompt

> Check whether an agent can access a ticket they are not assigned to or collaborating on. Also check whether supervisors have the intended unrestricted access.

### Prompt

> Review the reassignment authorization rules for agents and supervisors. Look for any way an unauthorized user could bypass the intended permissions.

---

# 5. Ticket Lifecycle

### Prompt

> Review my ticket lifecycle implementation:
>
> `new → open → pending → resolved → closed`
>
> Check valid transitions, invalid transitions, reopening behavior, permissions, and interactions with messages and SLA tracking.

### Prompt

> Find edge cases in this ticket state machine. Check what should happen when a user attempts an illegal transition or tries to reopen a ticket outside the allowed window.

### Prompt

> Debug this ticket lifecycle error. Explain the root cause and give me the smallest fix without changing the overall architecture.

---

# 6. SLA Clock & Alerts

### Prompt

> Review my SLA clock implementation. The clock should run in active states and pause in Pending, Resolved, and Closed. Check accumulated time, runningSince, pause/resume behavior, breach calculations, and reopening behavior.

### Prompt

> Review this SLA implementation for timestamp or calculation bugs. Check whether elapsed time is being calculated correctly when a ticket is paused and resumed multiple times.

### Prompt

> Review the SLA alert logic and identify possible duplicate alerts, stale alerts, or incorrect breach calculations.

---

# 7. Messages, Replies & Internal Notes

### Prompt

> Review my Message model and message controller. Check customer-visible replies versus internal notes, authorization, validation, timeline creation, and error handling.

### Prompt

> When a customer-visible reply is added to a Pending ticket, the ticket should automatically reopen. Review this flow and find any bugs.

### Prompt

> Debug this error in my message controller. Explain what is causing it and provide the minimal code change required.

---

# 8. Assignment & Collaborators

### Prompt

> Review my ticket assignment and collaborator implementation. Check supervisor permissions, agent permissions, primary assignee rules, collaborator rules, duplicate collaborators, invalid users, and error handling.

### Prompt

> Review this reassignment controller for authorization vulnerabilities and edge cases.

### Prompt

> Check whether my collaborator add/remove logic is consistent with the intended ticket access model.

---

# 9. Audit Timeline

### Prompt

> Review my audit timeline implementation. Check status changes, assignments, collaborator changes, replies, internal notes, priority changes, archive/restore events, timestamps, and event ordering.

### Prompt

> Identify timeline event types that are defined in the schema but are not actually being created by the application.

### Prompt

> Review whether the timeline provides a reliable chronological history of ticket activity.

---

# 10. Queue, Search & Filters

### Prompt

> Review my ticket queue API. It supports search, status, priority, category, assignee filters, sorting, pagination, and role-based scoping. Check the MongoDB query logic and look for authorization or filtering bugs.

### Prompt

> Review this MongoDB query and make sure an agent's search parameters cannot bypass their role-based ticket restriction.

### Prompt

> Find edge cases in my pagination, filtering, sorting, and search implementation.

---

# 11. Bulk Operations

### Prompt

> Review my bulk ticket reassignment and bulk close implementation. Check authorization, validation, partial failures, response structure, and database consistency.

### Prompt

> I want bulk operations to return the result of every ticket individually, including success or failure and the reason. Review my implementation and suggest improvements.

### Prompt

> Debug this bulk operation endpoint and check whether the route could be shadowed by another Express route.

---

# 12. CSV Export

### Prompt

> Review my CSV export implementation. The export should use the same filters as the ticket queue. Check whether the exported results correctly match the currently applied search, filters, sorting, and role-based scope.

### Prompt

> Debug why this CSV export route is not being reached. Check Express route ordering and parameterized routes.

---

# 13. Dashboard

### Prompt

> Review my dashboard implementation. It needs headline counts, status breakdown, agent breakdown, resolution trends, and SLA breach information. Check the database queries, aggregation logic, date calculations, role scoping, and error handling.

### Prompt

> Review this dashboard controller for runtime errors and inefficient database operations. Identify missing imports, incorrect queries, and edge cases such as an empty database.

---

# 14. Frontend Development

### Prompt

> Help me build the React frontend for my ResolveHQ customer-support application using the existing backend APIs. Keep the existing architecture and theme. Focus on clean UI, reusable components, responsive layouts, loading states, empty states, error states, and good user experience.

### Prompt

> Build this React component based on the existing project structure. Do not change the backend API. Reuse the existing components, theme, and design patterns wherever possible.

### Prompt

> Review this React component and improve its structure, readability, responsiveness, and user experience without unnecessarily changing its functionality.

### Prompt

> Make this page look more professional and consistent with the existing ResolveHQ theme. Keep the existing functionality and API integration unchanged.

---

# 15. Frontend Debugging

### Prompt

> Debug this React error. Explain the root cause, identify the exact file/code responsible, and give me the smallest reliable fix.

### Prompt

> Review this component for state-management bugs, incorrect API calls, unnecessary renders, missing loading/error states, and incorrect conditional rendering.

### Prompt

> This UI is not behaving as expected. Here is the code and screenshot. Identify the actual cause rather than guessing multiple unrelated fixes.

---

# 16. Frontend Styling & Theming

### Prompt

> Review this component's styling and make it consistent with the existing ResolveHQ theme. Do not introduce a completely different design system.

### Prompt

> here the conversation and history button is bluish and i don't like it make it to black similar theme

### Prompt

> not working still

The Tabs styling issue was ultimately resolved by moving the state-specific selector into a CSS module instead of trying to express the selector through Mantine's inline `styles` mechanism.

This was also an example of why AI-generated solutions were tested against the running application rather than accepted solely based on the explanation.

---

# 17. 404 Page

### Prompt

> please make 404 not found page for my application with ticket supporting (ticket pictures) themed and also make it similar theme i provide

The generated page was adapted to the application's actual routing and existing theme before being used.

---

# 18. Error Debugging

AI was frequently used after encountering actual runtime or build errors.

### Prompt

> Here is the error I am getting. Analyze the stack trace and the relevant code. Identify the root cause and explain why it is happening. Then provide the smallest fix.

### Prompt

> I applied the previous fix but the error is still occurring. Re-evaluate the problem based on this new error/output instead of repeating the previous solution.

### Prompt

> Debug this issue using the provided error message and code. Do not assume that the first obvious explanation is correct.

### Prompt

> Check whether this error is caused by the frontend, backend, API contract, routing, database model, or middleware. Identify which layer is actually responsible.

---

# 19. Code Review & Improvement

### Prompt

> Act as a senior developer reviewing this code. Identify bugs, security issues, maintainability problems, unnecessary complexity, and potential edge cases. Separate critical issues from optional improvements.

### Prompt

> Review this implementation without rewriting it from scratch. Tell me what is already good, what is risky, and what should be changed before deployment.

### Prompt

> Make this implementation cleaner and less error-prone while preserving its current behavior and API contract.

### Prompt

> Look for places where this code can fail in production even if the happy path works.

---

# 20. Faster Development

AI was also used to accelerate repetitive frontend and development tasks.

### Prompt

> Implement this component based on the existing patterns in my project. Keep the code concise and reusable and integrate it with the existing API and routing.

### Prompt

> Generate the boilerplate for this feature based on the structure already used elsewhere in the application.

### Prompt

> Refactor this repeated UI pattern into a reusable React component without changing the current behavior.

### Prompt

> Help me implement this feature faster while keeping the existing architecture, naming conventions, API contracts, and design system.

---

# 21. Documentation

### Prompt

> Create a professional README for my ResolveHQ MERN project based on the actual project requirements and implementation. Include features, architecture, setup instructions, API overview, project structure, and design decisions.

### Prompt

> Read the project requirements and structure the README around the ten core goals. Do not claim features that are not actually implemented.

### Prompt

> Add a High-Level Design section explaining the architecture, major components, request flow, data model, and important engineering decisions.

### Prompt

> Review this README against my actual implementation and identify statements that are placeholders, inaccurate, or need verification.

---

# 22. Engineering Decisions

### Prompt

> Help me document the major architectural decisions made during development. For each decision include the context, chosen approach, alternatives considered, and why the final approach was selected.

### Prompt

> Review these architectural decisions and make sure they describe actual engineering trade-offs rather than generic best practices.

### Prompt

> Check this decision document for claims that are not supported by actual measurements or implementation evidence.

---

# How AI Was Used

The overall development workflow was:

```text
Research
   ↓
Plan
   ↓
Implement
   ↓
AI-assisted review
   ↓
Debug / improve
   ↓
Run application
   ↓
Test actual behavior
   ↓
Accept / modify / reject suggestion
```

AI was therefore used as a **development assistant throughout the project**, including both ChatGPT and Claude.

The final implementation was not treated as correct merely because an AI model suggested it. Code was reviewed, integrated into the existing application, and tested against actual runtime behavior.

---

# Important Note

The prompts above are **representative prompts**, not a complete export of every conversation with ChatGPT and Claude.

They summarize the types of prompts used throughout development for research, implementation assistance, debugging, code review, schema review, error handling, frontend development, optimization, and documentation.

The purpose of this file is to provide transparent documentation of AI-assisted development without reproducing the entire conversation history.
