import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Registrar al usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Error al registrar usuario:', error);
        setError(error.message || 'Error al registrar usuario. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Agregar el usuario a la tabla `users`
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: data.user.id, // Vinculamos el ID del usuario autenticado
            email: data.user.email,
            first_name: firstName,
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          console.error('Error al agregar usuario a la tabla users:', insertError);
          setError('Error al guardar los datos del usuario: ' + insertError.message);
          setLoading(false);
          return;
        }

        console.log('Usuario registrado y agregado a la tabla users:', data.user);
        navigate('/login'); // Redirige al login después de registrarse
      }
    } catch (err) {
      console.error('Error inesperado al registrar usuario:', err);
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontSize: '2rem', fontWeight: 600, color: '#1976d2' }}
          >
            Crear Cuenta
          </Typography>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, backgroundColor: '#ffebee', borderRadius: '8px' }}
            >
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '12px' },
              }}
            />
            <TextField
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '12px' },
              }}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '12px' },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
              sx={{ py: 1.5, fontSize: '1.1rem', display: 'flex', gap: 1 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} color="inherit" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              disabled={loading}
              sx={{ color: '#1976d2', fontWeight: 500, '&:hover': { color: '#1565c0' } }}
            >
              ¿Ya tienes una cuenta? Inicia Sesión
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Register;