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
  const [open, setOpen] = useState(false);

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
                  ml: { sm: open ? '260px' : 0 }, // Ajustado para coincidir con el ancho del Drawer
                  mt: { xs: '72px', sm: '72px' }, // Aumentado para evitar solapamiento con TopBar (64px + algo de espacio)
                  pb: '64px', // Aumentado para asegurar espacio para el Footer
                  width: {
                    xs: '100%',
                    sm: open ? 'calc(100% - 260px)' : '100%', // Ajustado para coincidir con el Drawer
                  },
                  transition: 'margin-left 0.3s, width 0.3s',
                  boxSizing: 'border-box', // Asegura que el padding no afecte el ancho total
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
