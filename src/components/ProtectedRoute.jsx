// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <div>Cargando...</div>; // Mostrar un mensaje de carga mientras se verifica la autenticación
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;