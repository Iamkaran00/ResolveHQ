import { useState ,useEffect} from 'react';
import { useDispatch , useSelector } from 'react-redux';
import {Routes,Route , Navigate} from 'react-router-dom' ; 
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import TicketList from '../pages/TicketList';
import TicketDetail from '../pages/TicketDetail';
import Alerts from '../pages/Alerts';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import { getCurrentUser } from '../redux/operations/authOperations';



function App() {
const dispatch = useDispatch() ; 
const {user , authChecked} = useSelector(state => state.auth) ;

useEffect(()=> {
  dispatch(getCurrentUser()) ; 
},[dispatch]) ; 
 if(!authChecked) return null ; 
  return (
    <>
            {user && <Navbar />}
            <Routes>
                {/* public */}
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
                <Route path="/" element={<Navigate to={user ? "/tickets" : "/login"} replace />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
  )
}

export default App
