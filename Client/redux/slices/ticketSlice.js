import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    tickets: [],
    currentTicket: null,
    agents: [],
    messages: [],
    timeline: [],

    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    },

    filters: {
        q: "",
        status: "",       // '' | new | open | pending | resolved | closed
        priority: "",     // '' | low | medium | high | urgent
        category: "",     // '' | billing | technical | account | general
        assignee: "",
        sortBy: "createdAt",   // createdAt | priority | updatedAt
        sortDir: "desc",       // asc | desc
    },

    // goal 7: bulk reassign / bulk close selection + per-ticket results
    selectedTicketIds: [],
    bulkActionResults: null, // [{ ticketId, success, reason? }]

    loading: false,
    error: null,
};

const ticketSlice = createSlice({
    name: "ticket",
    initialState,
    reducers: {
        setTickets(state, action) {
            state.tickets = action.payload || [];
        },
        setPagination(state, action) {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        setCurrentTicket(state, action) {
            state.currentTicket = action.payload || null;
        },
        updateTicketInList(state, action) {
            const updated = action.payload;
            if (!updated?._id) return;
            state.tickets = state.tickets.map((t) =>
                t._id === updated._id ? updated : t
            );
            if (state.currentTicket?._id === updated._id) {
                state.currentTicket = updated;
            }
        },
        removeTicketFromList(state, action) {
            state.tickets = state.tickets.filter((t) => t._id !== action.payload);
        },

        setAgents(state, action) {
            state.agents = action.payload || [];
        },

        setMessages(state, action) {
            state.messages = action.payload || [];
        },
        addMessage(state, action) {
            if (action.payload) state.messages.push(action.payload);
        },

        setTimeline(state, action) {
            state.timeline = action.payload || [];
        },

        setFilters(state, action) {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.page = 1; // any filter change resets to page 1
        },
        resetFilters(state) {
            state.filters = initialState.filters;
            state.pagination.page = 1;
        },

        // bulk selection — agent role restrictions still enforced server-side,
        // this is just UI state for which checkboxes are ticked
        toggleTicketSelected(state, action) {
            const id = action.payload;
            state.selectedTicketIds = state.selectedTicketIds.includes(id)
                ? state.selectedTicketIds.filter((tid) => tid !== id)
                : [...state.selectedTicketIds, id];
        },
        selectAllTickets(state) {
            state.selectedTicketIds = state.tickets.map((t) => t._id);
        },
        clearSelectedTickets(state) {
            state.selectedTicketIds = [];
        },
        setBulkActionResults(state, action) {
            state.bulkActionResults = action.payload || null;
        },

        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload || null;
        },
        clearTicketState(state) {
            state.tickets = [];
            state.currentTicket = null;
            state.messages = [];
            state.timeline = [];
            state.selectedTicketIds = [];
            state.bulkActionResults = null;
            state.error = null;
        },
    },
});

export const {
    setTickets,
    setPagination,
    setCurrentTicket,
    updateTicketInList,
    removeTicketFromList,
    setAgents,
    setMessages,
    addMessage,
    setTimeline,
    setFilters,
    resetFilters,
    toggleTicketSelected,
    selectAllTickets,
    clearSelectedTickets,
    setBulkActionResults,
    setLoading,
    setError,
    clearTicketState,
} = ticketSlice.actions;

export default ticketSlice.reducer;