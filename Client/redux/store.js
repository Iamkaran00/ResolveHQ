import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import ticketReducer from "./slices/ticketSlice";
import alertReducer from "./slices/alertSlice";
import dashboardReducer from './slices/dashboardSlice';
export const store = configureStore({
    reducer: {
        auth: authReducer,
        ticket: ticketReducer,    
        alert: alertReducer,  
        dashboard : dashboardReducer    
    },
});

export default store;