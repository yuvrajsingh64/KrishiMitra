import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import Settings from './pages/Settings';
import ManageServices from './pages/ManageServices';
import BookingRequests from './pages/BookingRequests';
import Login from './pages/Login';
import Register from './pages/Register';
import Chatbot from './components/Chatbot';
import { useAuth } from './context/AuthContext';

// Wrapper: redirect to login if not authenticated
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Wrapper: redirect to dashboard if already authenticated
function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/settings" element={<Settings />} />
          {/* Provider-specific routes */}
          <Route path="/manage-services" element={<ManageServices />} />
          <Route path="/booking-requests" element={<BookingRequests />} />
        </Route>
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
