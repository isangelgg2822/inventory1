import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Intentamos iniciar sesión con las credenciales proporcionadas
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error al iniciar sesión:', error);
        setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Verificar si el usuario existe en la tabla `users`
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error al verificar usuario en la tabla users:', fetchError);
          setError('Error al verificar los datos del usuario: ' + fetchError.message);
          setLoading(false);
          return;
        }

        // Si no existe, agregar el usuario a la tabla `users`
        if (!existingUser) {
          const { error: insertError } = await supabase.from('users').insert([
            {
              id: data.user.id,
              email: data.user.email,
              first_name: data.user.email.split('@')[0], // Usamos el email como nombre por defecto
              created_at: new Date().toISOString(),
            },
          ]);

          if (insertError) {
            console.error('Error al agregar usuario a la tabla users:', insertError);
            setError('Error al guardar los datos del usuario: ' + insertError.message);
            setLoading(false);
            return;
          }
        }

        console.log('Usuario autenticado:', data.user);
        navigate('/'); // Redirige a la página principal después de iniciar sesión
      }
    } catch (err) {
      console.error('Error inesperado al iniciar sesión:', err);
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        padding: 0, // Sin padding para evitar desplazamientos
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '320px', sm: '400px' }, // Ancho máximo similar a maxWidth="xs"
          width: '100%', // Ocupa todo el ancho disponible dentro de maxWidth
          mx: 'auto', // Centrado horizontal absoluto
        }}
      >
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
            Iniciar Sesión
          </Typography>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, backgroundColor: '#ffebee', borderRadius: '8px' }}
              iconMapping={{
                error: <LockIcon fontSize="inherit" />,
              }}
            >
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#1976d2' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '12px' },
              }}
            />
            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#1976d2' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/reset-password')}
              disabled={loading}
              sx={{ color: '#1976d2', fontWeight: 500, '&:hover': { color: '#1565c0' } }}
            >
              ¿Olvidaste tu contraseña?
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/register')}
              disabled={loading}
              sx={{ color: '#1976d2', fontWeight: 500, '&:hover': { color: '#1565c0' } }}
            >
              Crear una cuenta
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;