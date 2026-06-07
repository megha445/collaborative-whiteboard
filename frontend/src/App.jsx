import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Signup from './components/Signup';
import Login from './components/Login';
import Home from './components/Home';
import Whiteboard from './components/Whiteboard';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-700">Loading...</div>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/signup" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/whiteboard/:roomId"
              element={
                <PrivateRoute>
                  <Whiteboard />
                </PrivateRoute>
              }
            />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
