// src/redux/operations/dashboardOperations.js

import { apiConnector } from "../../services/apiconnector";
import { auth_endpoints } from "../../services/api";
import { setDashboardData, setLoading, setError } from "../slices/dashboardSlice";

const { DASHBOARD_API } = auth_endpoints;

// supervisor-only — matches requireRole('supervisor') on GET /auth/dashboard
export const fetchDashboard = () => async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("GET", DASHBOARD_API);
        dispatch(setDashboardData({
            headline: res.data.headline,
            byStatus: res.data.byStatus,
            byAgent: res.data.byAgent,
            resolvedPerWeek: res.data.resolvedPerWeek,
        }));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Failed to load dashboard";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};