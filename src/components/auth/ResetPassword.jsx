// src/components/auth/ResetPassword.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si hay un token de restablecimiento en la URL
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const handleResetPasswordRequest = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Error al solicitar restablecimiento:', error);
        setError(error.message || 'Error al solicitar restablecimiento de contraseña.');
        setLoading(false);
        return;
      }

      setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
      setLoading(false);
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const newPassword = email; // En este caso, "email" se usa como campo temporal para la nueva contraseña
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error al actualizar contraseña:', error);
        setError(error.message || 'Error al actualizar la contraseña.');
        setLoading(false);
        return;
      }

      setMessage('Contraseña actualizada exitosamente. Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Restablecer Contraseña
      </Typography>
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={token ? handleUpdatePassword : handleResetPasswordRequest}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <TextField
          label={token ? 'Nueva Contraseña' : 'Correo Electrónico'}
          type={token ? 'password' : 'email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          variant="outlined"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading
            ? 'Procesando...'
            : token
            ? 'Actualizar Contraseña'
            : 'Enviar Enlace de Restablecimiento'}
        </Button>
        <Button
          variant="text"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Volver al Inicio de Sesión
        </Button>
      </Box>
    </Container>
  );
}

export default ResetPassword;