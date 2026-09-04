 // api endpoints store

export const auth_endpoints = {
  SIGNUP_API: "auth/signup",

  LOGIN_API: "auth/login",

  LOGOUT_API: "auth/logout",

  GET_USER_API: "auth/getuser",

  DASHBOARD_API: "auth/dashboard",
};


// =========================
// TICKET ENDPOINTS
// =========================

export const ticket_endpoints = {

  // Tickets
  CREATE_TICKET_API: "tickets",

  GET_TICKETS_API: "tickets",

  GET_TICKET_BY_ID_API: (id) =>
    `tickets/${id}`,

  UPDATE_TICKET_API: (id) =>
    `tickets/${id}`,

  // Ticket actions
  ARCHIVE_TICKET_API: (id) =>
    `tickets/${id}/archive`,

  RESTORE_TICKET_API: (id) =>
    `tickets/${id}/restore`,

  REASSIGN_TICKET_API: (id) =>
    `tickets/${id}/reassign`,

  UPDATE_TICKET_STATUS_API: (id) =>
    `tickets/${id}/status`,


  // Bulk actions
  BULK_REASSIGN_API:
    "tickets/bulk/reassign",

  BULK_CLOSE_API:
    "tickets/bulk/close",


  // Other ticket APIs
  EXPORT_TICKETS_API:
    "tickets/export",

  GET_AGENTS_API:
    "tickets/agents",


  // Messages
  ADD_MESSAGE_API: (id) =>
    `tickets/${id}/messages`,

  GET_MESSAGES_API: (id) =>
    `tickets/${id}/messages`,


  // Collaborators
  ADD_COLLABORATOR_API: (id) =>
    `tickets/${id}/collaborators`,

  REMOVE_COLLABORATOR_API: (id) =>
    `tickets/${id}/collaborators`,


  // Timeline
  GET_TIMELINE_API: (id) =>
    `tickets/${id}/timeline`,
};


// =========================
// SLA ALERT ENDPOINTS
// =========================

export const alert_endpoints = {

  GET_ALERTS_API:
    "alerts",

  ACKNOWLEDGE_ALERT_API: (id) =>
    `alerts/${id}/acknowledge`,
};