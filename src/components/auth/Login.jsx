// src/components/auth/Login.jsx
import { useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error logging in:', error);
      alert('Error al iniciar sesión');
      return;
    }

    navigate('/'); // Redirige a la página principal después del login
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4" gutterBottom>
          Iniciar Sesión
        </Typography>
        <TextField
          label="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          fullWidth
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          fullWidth
        />
        <Button variant="contained" color="primary" onClick={handleLogin} fullWidth>
          Iniciar Sesión
        </Button>
      </Box>
    </Container>
  );
}

export default Login;