// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import React, { memo } from 'react';

// Usamos React.memo para evitar renderizados innecesarios
const ProtectedRoute = memo(({ children, session }) => {
  console.log('ProtectedRoute rendering - Session:', session);
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
});

// Aseguramos que ProtectedRoute solo se renderice de nuevo si session cambia
ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;