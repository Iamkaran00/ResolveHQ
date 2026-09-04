import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    headline: {
        open: 0,
        pending: 0,
        resolvedThisWeek: 0,
        breaching: 0,
    },

    byStatus: [],
    byAgent: [],
    resolvedPerWeek: [],

    loading: false,
    error: null,
};

const dashboardSlice = createSlice({
    name: "dashboard",

    initialState,

    reducers: {
        setDashboardData(state, value) {
            state.headline = value.payload.headline;
            state.byStatus = value.payload.byStatus;
            state.byAgent = value.payload.byAgent;
            state.resolvedPerWeek = value.payload.resolvedPerWeek;
        },

        setLoading(state, value) {
            state.loading = value.payload;
        },

        setError(state, value) {
            state.error = value.payload;
        },

        clearDashboard(state) {
            state.headline = {
                open: 0,
                pending: 0,
                resolvedThisWeek: 0,
                breaching: 0,
            };

            state.byStatus = [];
            state.byAgent = [];
            state.resolvedPerWeek = [];
            state.error = null;
        },
    },
});

export const {
    setDashboardData,
    setLoading,
    setError,
    clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;