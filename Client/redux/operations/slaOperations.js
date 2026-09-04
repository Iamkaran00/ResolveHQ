// src/redux/operations/alertOperations.js

import { apiConnector } from "../../services/apiconnector";
import { alert_endpoints } from "../../services/api";
import { setAlerts, removeAlert, setLoading, setError } from "../slices/alertSlice";

const { GET_ALERTS_API, ACKNOWLEDGE_ALERT_API } = alert_endpoints;

// ---------- List active alerts (goal 10) ----------
export const fetchAlerts = () => async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("GET", GET_ALERTS_API);
        dispatch(setAlerts(res.data.alerts));
    } catch (error) {
        dispatch(setError(error.response?.data?.message || "Failed to load alerts"));
    } finally {
        dispatch(setLoading(false));
    }
};

// ---------- Acknowledge (clears from list; agent-only-if-assigned enforced server-side) ----------
export const acknowledgeAlert = (id) => async (dispatch) => {
    try {
        await apiConnector("PATCH", ACKNOWLEDGE_ALERT_API(id));
        dispatch(removeAlert(id));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to acknowledge alert";
        dispatch(setError(message));
        return { success: false, message };
    }
};