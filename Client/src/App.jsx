import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import TicketList from '../pages/TicketList';
import TicketDetail from '../pages/TicketDetail';
import Alerts from '../pages/Alerts';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import CreateTicket from '../pages/CreateTicket';
import { getCurrentUser } from '../redux/operations/authOperations';
import PublicFooter from '../components/PublicFooter';

import LoadingScreen from '../pages/LoadingScreen';

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, authChecked } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  if (!authChecked) return <LoadingScreen/>;

  const showAppNavbar = user && location.pathname !== "/";

  const showPublicFooter = location.pathname === "/";

  return (
    <>
      {showAppNavbar && <Navbar />}
      <Routes>
        {/* public homepage — visible whether logged in or not */}
        <Route path="/" element={<Home />} />

        {/* public — auth pages */}
        <Route
          path="/login"
          element={user ? <Navigate to="/tickets" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/tickets" replace /> : <Register />}
        />

        {/* protected — any logged-in user */}
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <TicketList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <TicketDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets/new"
          element={
            <ProtectedRoute>
              <CreateTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />

        {/* protected — supervisor only, matches requireRole('supervisor') on /dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["supervisor"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showPublicFooter && <PublicFooter />}
    </>
  );
}

export default App;
