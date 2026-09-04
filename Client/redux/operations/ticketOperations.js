// src/redux/operations/ticketOperations.js

import { apiConnector } from "../../services/apiconnector";
import { ticket_endpoints } from "../../services/api";
import {
    setTickets,
    setPagination,
    setCurrentTicket,
    updateTicketInList,
    removeTicketFromList,
    setAgents,
    setMessages,
    addMessage as addMessageAction,
    setTimeline,
    setBulkActionResults,
    clearSelectedTickets,
    setLoading,
    setError,
} from "../slices/ticketSlice";

const {
    CREATE_TICKET_API,
    GET_TICKETS_API,
    GET_TICKET_BY_ID_API,
    UPDATE_TICKET_API,
    ARCHIVE_TICKET_API,
    RESTORE_TICKET_API,
    REASSIGN_TICKET_API,
    UPDATE_TICKET_STATUS_API,
    BULK_REASSIGN_API,
    BULK_CLOSE_API,
    EXPORT_TICKETS_API,
    GET_AGENTS_API,
    ADD_MESSAGE_API,
    GET_MESSAGES_API,
    ADD_COLLABORATOR_API,
    REMOVE_COLLABORATOR_API,
    GET_TIMELINE_API,
} = ticket_endpoints;

// ---------- List / search / filter / paginate (goal 6) ----------
export const fetchTickets = () => async (dispatch, getState) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const { filters, pagination } = getState().ticket;
        const params = { ...filters, page: pagination.page, limit: pagination.limit };
        Object.keys(params).forEach((k) => params[k] === "" && delete params[k]);

        const res = await apiConnector("GET", GET_TICKETS_API, null, params);
        dispatch(setTickets(res.data.tickets));
        dispatch(setPagination(res.data.pagination));
    } catch (error) {
        dispatch(setError(error.response?.data?.message || "Failed to load tickets"));
    } finally {
        dispatch(setLoading(false));
    }
};

export const fetchTicketById = (id) => async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("GET", GET_TICKET_BY_ID_API(id));
        dispatch(setCurrentTicket(res.data.ticket));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to load ticket";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

// ---------- Create / update (goal 2) ----------
export const createTicket = (payload) => async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("POST", CREATE_TICKET_API, payload);
        return { success: true, ticket: res.data.ticket };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to create ticket";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

export const updateTicket = (id, payload) => async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("PATCH", UPDATE_TICKET_API(id), payload);
        dispatch(setCurrentTicket(res.data.ticket));
        dispatch(updateTicketInList(res.data.ticket));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to update ticket";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

// ---------- Archive / restore (goal 2) ----------
export const archiveTicket = (id) => async (dispatch) => {
    try {
        const res = await apiConnector("PATCH", ARCHIVE_TICKET_API(id));
        dispatch(removeTicketFromList(id)); // archived tickets drop out of default queue views
        dispatch(setCurrentTicket(res.data.ticket));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to archive ticket";
        dispatch(setError(message));
        return { success: false, message };
    }
};

export const restoreTicket = (id) => async (dispatch) => {
    try {
        await apiConnector("PATCH", RESTORE_TICKET_API(id));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to restore ticket";
        dispatch(setError(message));
        return { success: false, message };
    }
};

// ---------- Reassign (goal 1 + 5 rules enforced server-side) ----------
export const reassignTicket = (id, newAssigneeId) => async (dispatch) => {
    try {
        const res = await apiConnector("PATCH", REASSIGN_TICKET_API(id), { newAssigneeId });
        dispatch(setCurrentTicket(res.data.ticket));
        dispatch(updateTicketInList(res.data.ticket));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to reassign ticket";
        dispatch(setError(message));
        return { success: false, message };
    }
};

// ---------- Status / lifecycle (goal 4) ----------
export const updateTicketStatus = (id, status) => async (dispatch) => {
    try {
        const res = await apiConnector("PATCH", UPDATE_TICKET_STATUS_API(id), { status });
        dispatch(setCurrentTicket(res.data.ticket));
        dispatch(updateTicketInList(res.data.ticket));
        return { success: true };
    } catch (error) {
        // this is where illegal-transition messages from changeStatus() surface — show them, don't swallow
        const message = error.response?.data?.message || "Failed to update status";
        dispatch(setError(message));
        return { success: false, message };
    }
};

// ---------- Collaborators (goal 5) ----------
export const addCollaborator = (id, agentId) => async (dispatch) => {
    try {
        const res = await apiConnector("POST", ADD_COLLABORATOR_API(id), { agentId });
        dispatch(setCurrentTicket(res.data.ticket));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to add collaborator";
        dispatch(setError(message));
        return { success: false, message };
    }
};

export const removeCollaborator = (id, agentId) => async (dispatch) => {
    try {
        const res = await apiConnector("DELETE", REMOVE_COLLABORATOR_API(id), { agentId });
        dispatch(setCurrentTicket(res.data.ticket));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to remove collaborator";
        dispatch(setError(message));
        return { success: false, message };
    }
};

// ---------- Agents list (for assignee dropdowns) ----------
export const fetchAgents = () => async (dispatch) => {
    try {
        const res = await apiConnector("GET", GET_AGENTS_API);
        dispatch(setAgents(res.data.agents));
    } catch (error) {
        dispatch(setError(error.response?.data?.message || "Failed to load agents"));
    }
};

// ---------- Messages / replies (goal 3) ----------
export const fetchMessages = (id) => async (dispatch) => {
    try {
        const res = await apiConnector("GET", GET_MESSAGES_API(id));
        dispatch(setMessages(res.data.messages));
    } catch (error) {
        dispatch(setError(error.response?.data?.message || "Failed to load messages"));
    }
};

export const addMessage = (id, body, isInternal) => async (dispatch) => {
    try {
        const res = await apiConnector("POST", ADD_MESSAGE_API(id), { body, isInternal });
        dispatch(addMessageAction(res.data.message));
        // a customer-visible reply on a pending ticket flips it back to open server-side —
        // refetch the ticket so status/clock reflect that without guessing at it client-side
        if (!isInternal) {
            const ticketRes = await apiConnector("GET", GET_TICKET_BY_ID_API(id));
            dispatch(setCurrentTicket(ticketRes.data.ticket));
            dispatch(updateTicketInList(ticketRes.data.ticket));
        }
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to add message";
        dispatch(setError(message));
        return { success: false, message };
    }
};

// ---------- Timeline (goal 9) ----------
export const fetchTimeline = (id) => async (dispatch) => {
    try {
        const res = await apiConnector("GET", GET_TIMELINE_API(id));
        dispatch(setTimeline(res.data.events));
    } catch (error) {
        dispatch(setError(error.response?.data?.message || "Failed to load timeline"));
    }
};

// ---------- Bulk actions (goal 7) ----------
export const bulkReassign = (ticketIds, newAssigneeId) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const res = await apiConnector("PATCH", BULK_REASSIGN_API, { ticketIds, newAssigneeId });
        dispatch(setBulkActionResults(res.data.results));
        dispatch(clearSelectedTickets());
        return { success: true, results: res.data.results };
    } catch (error) {
        const message = error.response?.data?.message || "Bulk reassign failed";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

export const bulkClose = (ticketIds) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const res = await apiConnector("PATCH", BULK_CLOSE_API, { ticketIds });
        dispatch(setBulkActionResults(res.data.results));
        dispatch(clearSelectedTickets());
        return { success: true, results: res.data.results };
    } catch (error) {
        const message = error.response?.data?.message || "Bulk close failed";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

// ---------- CSV export (goal 7) ----------
export const exportTicketsCsv = () => async (dispatch, getState) => {
    try {
        const { filters } = getState().ticket;
        const params = { ...filters };
        Object.keys(params).forEach((k) => params[k] === "" && delete params[k]);

        const res = await apiConnector("GET", EXPORT_TICKETS_API, null, params, null, { responseType: "blob" });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "tickets.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (error) {
        dispatch(setError("Failed to export tickets"));
        return { success: false };
    }
};