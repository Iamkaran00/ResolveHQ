import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    alerts: [],       // active/unacknowledged alerts shown in the alerts area
    count: 0,          // badge count in navigation
    loading: false,
    error: null,
};

const alertSlice = createSlice({
    name: "alert",
    initialState,
    reducers: {
        setAlerts(state, action) {
            const alerts = action.payload || [];
            state.alerts = alerts;
            state.count = alerts.length;
        },
        // goal 10: acknowledging clears it from the list immediately (optimistic or post-response)
        removeAlert(state, action) {
            const id = action.payload;
            state.alerts = state.alerts.filter((a) => a._id !== id);
            state.count = state.alerts.length;
        },
        // if a ticket breaches again after reopening, the sweep produces a fresh alert —
        // just add it in rather than refetching the whole list
        addAlert(state, action) {
            const alert = action.payload;
            if (!alert) return;
            const exists = state.alerts.some((a) => a._id === alert._id);
            if (!exists) {
                state.alerts.push(alert);
                state.count = state.alerts.length;
            }
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload || null;
        },
        clearAlertState(state) {
            state.alerts = [];
            state.count = 0;
            state.error = null;
        },
    },
});

export const {
    setAlerts,
    removeAlert,
    addAlert,
    setLoading,
    setError,
    clearAlertState,
} = alertSlice.actions;

export default alertSlice.reducer;