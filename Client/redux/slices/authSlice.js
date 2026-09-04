import { createSlice } from "@reduxjs/toolkit";

const getStoredUser = () => {
    try {
        const data = localStorage.getItem("user");
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

const initialState = {
    user: getStoredUser(),
    isAuthenticated: !!getStoredUser(),
    loading: false,
    error: null,
    authChecked: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload || null;
            state.isAuthenticated = !!action.payload;
            try {
                if (action.payload) {
                    localStorage.setItem("user", JSON.stringify(action.payload));
                } else {
                    localStorage.removeItem("user");
                }
            } catch {}
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload || null;
        },
        setAuthChecked(state, action) {
            state.authChecked = action.payload;
        },
        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
            try {
                localStorage.removeItem("user");
            } catch {}
        },
    },
});

export const { setUser, setLoading, setError, setAuthChecked, logout } = authSlice.actions;
export default authSlice.reducer;