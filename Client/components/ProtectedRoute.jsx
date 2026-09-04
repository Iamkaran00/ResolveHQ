// src/routes/ProtectedRoute.jsx

import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
    const { user, authChecked } = useSelector((state) => state.auth);
    const location = useLocation();

    // cookie check (getCurrentUser) still in flight — don't redirect prematurely
    if (!authChecked) return null;

    // no valid session — send to login, remember where they were headed
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // role gate — mirrors requireRole('supervisor') on the backend (e.g. /dashboard)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/tickets" replace />;
    }

    return children;
}

export default ProtectedRoute;