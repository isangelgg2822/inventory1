// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import POS from './components/POS/POS';
import Settings from './components/Settings/Settings';
import Inventory from './components/Inventory/Inventory';
import Reports from './components/Reports/Reports';
import Home from './components/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { Typography } from '@mui/material';
import { DashboardProvider } from './context/DashboardContext'; // Importamos desde DashboardContext

function App() {
  return (
    <DashboardProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Typography variant="h6">404 - Página no encontrada</Typography>} />
        </Routes>
      </Router>
    </DashboardProvider>
  );
}

export default App;