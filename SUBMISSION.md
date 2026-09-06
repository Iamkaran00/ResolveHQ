# Submission

## Links

* **GitHub repository:** https://github.com/Iamkaran00/ResolveHQ
* **Live application:** https://resolve-hq.vercel.app/

## Notes for the reviewer

The backend is hosted on Render's free tier and may sleep after a period of inactivity. Because of this, the first request after inactivity can take some time while the server wakes up.

**Backend URL:** https://resolvehq-9509.onrender.com

## Demo credentials

| Role       | Email                                           | Password      |
| ---------- | ----------------------------------------------- | ------------- |
| Supervisor | [abhijeet@gmail.com](mailto:abhijeet@gmail.com) | abhijeet sahu |
| Agent      | [rahul@gmail.com](mailto:rahul@gmail.com)       | rahul sahu    |

## Stack

| Layer    | What I used                            | Why                                                                                                                                                                                                                                                                                            |
| -------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React, Redux, React Router, Mantine UI | Mantine provided accessible, pre-built components such as tables, tabs, selects, and forms, which allowed more time to be spent on the actual ticket workflow. Redux helped keep shared application state, filters, and selections predictable across the queue, ticket detail, and dashboard. |
| Backend  | Node.js, Express                       | Express provided a lightweight and flexible REST API structure that was suitable for the project's ticket, authentication, bulk-action, and dashboard requirements. Using JavaScript across the frontend and backend also kept the development workflow consistent.                            |
| Database | MongoDB, Mongoose                      | MongoDB works well with the different ticket-related entities and the different shapes of timeline events. Mongoose adds schema validation and structured models on top of MongoDB.                                                                                                            |
| Hosting  | Vercel, Render, MongoDB Atlas          | These services provided a straightforward deployment workflow with GitHub integration and free-tier options, which suited the scope and time constraints of the assessment.                                                                                                                    |

---

# Goal Checklist

| #  | Goal                                                          | Status   | Notes                                                                                                                                                                                    |
| -- | ------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Accounts and roles                                            | **Done** | Authentication, agent/supervisor roles, JWT authentication using HttpOnly cookies, role-based authorization, and ticket-level access control are implemented.                            |
| 2  | Tickets (create, edit, archive/restore)                       | **Done** | Ticket creation, listing, viewing, editing, archiving, restoring, and priority handling are implemented.                                                                                 |
| 3  | Replies inside tickets                                        | **Done** | Customer-visible replies and internal notes are supported. Customer-visible replies can also reopen a Pending ticket as part of the lifecycle flow.                                      |
| 4  | Ticket lifecycle (status transitions, SLA clock pause/resume) | **Done** | The ticket state machine supports the required lifecycle transitions, reopening behavior, and SLA clock pause/resume behavior across the required states.                                |
| 5  | Collaborators                                                 | **Done** | Tickets support adding and removing collaborators, with authorization based on the user's role and relationship to the ticket.                                                           |
| 6  | Finding tickets (server-side search/filter/sort/pagination)   | **Done** | The queue supports server-side search, status, priority, category, and assignee filters, sorting, pagination, and role-based ticket scoping.                                             |
| 7  | Bulk actions + CSV export                                     | **Done** | Bulk reassignment and bulk closing are implemented with per-ticket success/failure reporting. CSV export uses the queue's filtering logic.                                               |
| 8  | Dashboard                                                     | **Done** | The dashboard provides headline ticket counts, status and agent breakdowns, resolution trends, and SLA breach information.                                                               |
| 9  | Immutable history / timeline                                  | **Done** | Ticket activity is recorded through timeline events covering status changes, assignments, replies, internal notes, collaborator changes, priority changes, and archive/restore activity. |
| 10 | SLA alerts                                                    | **Done** | SLA tracking includes the response clock, at-risk and breach thresholds, alert creation and acknowledgement, and a periodic sweep for detecting SLA conditions.                          |

---

# How much time did you actually spend?

I spent approximately **12 hours** of focused development time on the assessment.

The time included backend implementation, frontend development, debugging, code review, integration work, documentation, deployment, and fixing issues discovered during development.

I also used ChatGPT and Claude throughout the development process as development assistants for research, implementation guidance, schema and controller review, debugging, error handling, frontend development, UI improvements, and documentation.

---

# What would you do next, with another 12 hours?

With another 12 hours, I would focus first on **optimization, testing, and production hardening**, and then use the remaining time to build selected stretch goals.

On the engineering side, I would:

* Improve backend query performance and database indexing.
* Review API response times and unnecessary database operations.
* Improve frontend rendering performance and reduce unnecessary API calls.
* Improve loading, error, and empty states across the application.
* Add stronger automated tests around authorization, lifecycle transitions, SLA calculations, and bulk operations.
* Improve responsive behavior and polish some of the UI interactions.
* Review the application for additional edge cases and production-level error handling.

After that, I would work on the stretch features that add the most value to a support-operations product, such as:

* Canned responses
* CSAT/rating
* Ticket tagging
* Knowledge base
* Auto-routing
* Ticket merging
* Priority-specific SLA policies
* Email notifications/digests

I would prioritize the stretch goals based on how much operational value they provide rather than simply trying to add as many features as possible.

---

# What are you least happy with in this codebase, and why?

The area I am least happy with is the **overall level of production hardening**.

The application implements the main support-ticket workflow, but with more development time I would make the codebase more robust through additional automated testing, stronger validation, improved edge-case handling, and more performance optimization.

The lifecycle and SLA logic are particularly important because they contain business-critical behavior. I would add more automated tests around status transitions, reopening, SLA pause/resume calculations, breach detection, and repeated lifecycle changes.

I would also spend more time refactoring some controller logic into smaller reusable services where appropriate. This would make the backend easier to maintain as more features are added.

On the frontend, I would further improve responsiveness, loading states, error handling, and performance. The current UI was developed under a relatively tight time constraint, so there are places where functionality took priority over deeper UI polish.

I am also aware that some implementation decisions were made specifically to fit the assessment's scope and time constraints. With another development cycle, I would revisit those decisions with a larger dataset and more production-oriented requirements in mind.

Overall, I am satisfied with the breadth of the implementation, but the next major improvement would be turning the current application into a more thoroughly tested and production-hardened system.
