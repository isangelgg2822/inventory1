import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import DrawerProvider from './context/DrawerContext';
import DashboardProvider from './context/DashboardContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import PointOfSale from './components/POS/POS';
import Settings from './components/Settings/Settings';
import Inventory from './components/Inventory/Inventory';
import Reports from './components/Reports/Reports';
import Navbar from './components/Navbar';
import TopBar from './components/Topbar'; // Nuevo componente
import Footer from './components/Footer'; // Nuevo componente
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import { Box } from '@mui/material';
import { supabase } from './supabase';
import './fonts.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // Estado para controlar el Drawer

  const fetchSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSession]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <DrawerProvider>
        <DashboardProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              {/* TopBar y Navbar se muestran en todas las rutas protegidas */}
              {session && (
                <>
                  <TopBar onDrawerOpen={() => setOpen(true)} />
                  <Navbar open={open} setOpen={setOpen} />
                </>
              )}
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  ml: { sm: open ? '240px' : 0 },
                  mt: { xs: 8, sm: 8 }, // Margen superior para TopBar
                  pb: 6, // Margen inferior para Footer
                  width: {
                    xs: '100%',
                    sm: open ? 'calc(100% - 240px)' : '100%',
                  },
                  transition: 'margin-left 0.3s, width 0.3s',
                }}
              >
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/"
                    element={
                      session ? <Home /> : <Navigate to="/login" replace />
                    }
                  />
                  <Route
                    path="/pos"
                    element={
                      <ProtectedRoute session={session}>
                        <PointOfSale />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRoute session={session}>
                        <Inventory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute session={session}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute session={session}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Box>
              {session && <Footer />}
            </Box>
          </Router>
        </DashboardProvider>
      </DrawerProvider>
    </ThemeProvider>
  );
}

export default App;