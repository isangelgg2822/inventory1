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
import TopBar from './components/Topbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import { Box } from '@mui/material';
import { supabase } from './supabase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true); // Cambiado a true para que el Drawer esté abierto por defecto

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
                  ml: { xs: 0, sm: open ? '240px' : 0 }, // Ajustado para el ancho del Drawer (240px)
                  mt: { xs: '80px', sm: '80px' }, // Aumentado para evitar solapamiento con TopBar
                  pb: '80px', // Aumentado para asegurar espacio para el Footer
                  width: {
                    xs: '100%',
                    sm: open ? 'calc(100% - 240px)' : '100%', // Ajustado para el Drawer
                  },
                  transition: 'margin-left 0.3s, width 0.3s',
                  boxSizing: 'border-box',
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