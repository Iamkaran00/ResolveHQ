// src/redux/operations/authOperations.js

import { apiConnector } from '../../services/apiconnector';

import { setUser, setLoading, setError, setAuthChecked, logout } from "../slices/authSlice";
import { auth_endpoints } from '../../services/api';

const { SIGNUP_API, LOGIN_API, LOGOUT_API, GET_USER_API } = auth_endpoints;

export const signUp = (name, email, password) => async (dispatch) => {
    console.log(name) ; 
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("POST", SIGNUP_API, { name, email, password });
        console.log(res , 'in sign up') ; 
        dispatch(setUser(res.data.user));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Signup failed";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

export const login = (email, password) => async (dispatch) => {
    console.log(email); 
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
        const res = await apiConnector("POST", LOGIN_API, { email, password });
                console.log(res , 'in sign in') ; 

        dispatch(setUser(res.data.user));
        return { success: true };
    } catch (error) {
        const message = error.response?.data?.message || "Login failed";
        dispatch(setError(message));
        return { success: false, message };
    } finally {
        dispatch(setLoading(false));
    }
};

export const logoutUser = () => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        await apiConnector("POST", LOGOUT_API);
    } catch (error) {
        console.log("Logout request failed:", error.response?.data?.message);
    } finally {
        dispatch(logout());
        dispatch(setLoading(false));
    }
};

export const getCurrentUser = () => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const res = await apiConnector("GET", GET_USER_API);
        dispatch(setUser(res.data.user));
    } catch (error) {
        dispatch(setUser(null)); // cookie missing/expired — not an error state, just logged out
    } finally {
        dispatch(setAuthChecked(true));
        dispatch(setLoading(false));
    }
};