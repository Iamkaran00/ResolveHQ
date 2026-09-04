import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import ticketReducer from "./slices/ticketSlice";
import alertReducer from "./slices/alertSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ticket: ticketReducer,    
        alert: alertReducer,      
    },
});

export default store;