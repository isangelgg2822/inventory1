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
import CashAdvanceManager from "./components/Avance/CashAdvanceManager"
import CashAdvanceReports from "./components/Avance/CashAdvanceReports"
import { Box } from '@mui/material';
import { supabase } from './supabase';



function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true); // Drawer abierto por defecto

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
    <Router>
      <Routes>
        {/* Rutas de autenticación fuera de ThemeProvider */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Rutas principales dentro de ThemeProvider */}
        <Route
          path="/*"
          element={
            <ThemeProvider theme={theme}>
              <DrawerProvider>
                <DashboardProvider>
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
                        p: { xs: 2, sm: 3, md: 4 },
                        ml: {
                          xs: 0,
                          sm: open ? '240px' : 0,
                          lg: open ? '280px' : 0,
                        },
                        mt: { xs: '64px', sm: '80px' },
                        pb: { xs: '60px', sm: '80px' },
                        width: {
                          xs: '100%',
                          sm: open ? 'calc(100% - 240px)' : '100%',
                          lg: open ? 'calc(100% - 280px)' : '100%',
                        },
                        transition: 'margin-left 0.3s, width 0.3s',
                        boxSizing: 'border-box',
                        maxWidth: { xl: '1920px' },
                        mx: { xl: 'auto' },
                      }}
                    >
                      <Routes>
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
                        <Route
  path="/avance/gestion"
  element={
    <ProtectedRoute session={session}>
      <CashAdvanceManager />
    </ProtectedRoute>
  }
/>
<Route
  path="/avance/reportes"
  element={
    <ProtectedRoute session={session}>
      <CashAdvanceReports />
    </ProtectedRoute>
  }
                        />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                      </Routes>
                    </Box>
                    {session && <Footer />}
                  </Box>
                </DashboardProvider>
              </DrawerProvider>
            </ThemeProvider>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;