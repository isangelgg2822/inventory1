// import React, { useState } from 'react';
// import { supabase } from '../../supabase';
// import { useNavigate } from 'react-router-dom';
// import {
//   Container,
//   TextField,
//   Button,
//   Typography,
//   Box,
//   Alert,
//   CircularProgress,
//   InputAdornment,
//   IconButton,
// } from '@mui/material';
// import EmailIcon from '@mui/icons-material/Email';
// import LockIcon from '@mui/icons-material/Lock';
// import Visibility from '@mui/icons-material/Visibility';
// import VisibilityOff from '@mui/icons-material/VisibilityOff';

// function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     try {
//       // Intentamos iniciar sesión con las credenciales proporcionadas
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) {
//         console.error('Error al iniciar sesión:', error);
//         setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
//         setLoading(false);
//         return;
//       }

//       if (data.user) {
//         // Verificar si el usuario existe en la tabla `users`
//         const { data: existingUser, error: fetchError } = await supabase
//           .from('users')
//           .select('id')
//           .eq('id', data.user.id)
//           .single();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Error al verificar usuario en la tabla users:', fetchError);
//           setError('Error al verificar los datos del usuario: ' + fetchError.message);
//           setLoading(false);
//           return;
//         }

//         // Si no existe, agregar el usuario a la tabla `users`
//         if (!existingUser) {
//           const { error: insertError } = await supabase.from('users').insert([
//             {
//               id: data.user.id,
//               email: data.user.email,
//               first_name: data.user.email.split('@')[0], // Usamos el email como nombre por defecto
//               created_at: new Date().toISOString(),
//             },
//           ]);

//           if (insertError) {
//             console.error('Error al agregar usuario a la tabla users:', insertError);
//             setError('Error al guardar los datos del usuario: ' + insertError.message);
//             setLoading(false);
//             return;
//           }
//         }

//         console.log('Usuario autenticado:', data.user);
//         navigate('/'); // Redirige a la página principal después de iniciar sesión
//       }
//     } catch (err) {
//       console.error('Error inesperado al iniciar sesión:', err);
//       setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
//       setLoading(false);
//     }
//   };

//   const handleClickShowPassword = () => {
//     setShowPassword((prev) => !prev);
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: '70vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
//         padding: 2,
        
//       }}
//     >
//       <Container maxWidth="xs">
//         <Box
//           sx={{
//             backgroundColor: '#fff',
//             borderRadius: '12px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
//             p: 4,
//             display: 'flex',
//             flexDirection: 'column',
//             gap: 3,
//           }}
//         >
//           <Typography
//             variant="h4"
//             align="center"
//             gutterBottom
//             sx={{ fontSize: 'rem', fontWeight: 600, color: '#1976d2' }}
//           >
//             Iniciar Sesión
//           </Typography>
//           {error && (
//             <Alert
//               severity="error"
//               sx={{ mb: 2, backgroundColor: '#ffebee', borderRadius: '8px' }}
//               iconMapping={{
//                 error: <LockIcon fontSize="inherit" />,
//               }}
//             >
//               {error}
//             </Alert>
//           )}
//           <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//             <TextField
//               label="Correo Electrónico"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               fullWidth
//               variant="outlined"
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <EmailIcon sx={{ color: '#1976d2' }} />
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{
//                 backgroundColor: '#fff',
//                 borderRadius: '8px',
//                 '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '12px' },
//               }}
//             />
//             <TextField
//               label="Contraseña"
//               type={showPassword ? 'text' : 'password'}
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               fullWidth
//               variant="outlined"
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <LockIcon sx={{ color: '#1976d2' }} />
//                   </InputAdornment>
//                 ),
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <IconButton onClick={handleClickShowPassword} edge="end">
//                       {showPassword ? <VisibilityOff /> : <Visibility />}
//                     </IconButton>
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{
//                 backgroundColor: '#fff',
//                 borderRadius: '8px',
//                 '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '12px' },
//               }}
//             />
//             <Button
//               type="submit"
//               variant="contained"
//               color="primary"
//               disabled={loading}
//               fullWidth
//               sx={{ py: 1.5, fontSize: '1.1rem', display: 'flex', gap: 1 }}
//             >
//               {loading ? (
//                 <>
//                   <CircularProgress size={24} color="inherit" />
//                   Iniciando...
//                 </>
//               ) : (
//                 'Iniciar Sesión'
//               )}
//             </Button>
//             <Button
//               variant="text"
//               onClick={() => navigate('/reset-password')}
//               disabled={loading}
//               sx={{ color: '#1976d2', fontWeight: 500, '&:hover': { color: '#1565c0' } }}
//             >
//               ¿Olvidaste tu contraseña?
//             </Button>
//             <Button
//               variant="text"
//               onClick={() => navigate('/register')}
//               disabled={loading}
//               sx={{ color: '#1976d2', fontWeight: 500, '&:hover': { color: '#1565c0' } }}
//             >
//               Crear una cuenta
//             </Button>
//           </Box>
//         </Box>
//       </Container>
//     </Box>
//   );
// }

// export default Login;
import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Iniciar Sesión</h2>
        {error && (
          <div className="error-alert">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-wrapper">
            <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
              placeholder="Correo Electrónico"
            />
          </div>
          <div className="input-wrapper">
            <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.1-.9-2-2-2s-2 .9-2 2 2 4 2 4 2-2.9 2-4zm0 0c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4-2-2.9-2-4zm-6 9c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H6z" />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              placeholder="Contraseña"
            />
            <button
              type="button"
              onClick={handleClickShowPassword}
              className="toggle-password"
            >
              {showPassword ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-4.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`login-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Iniciando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/reset-password')}
            disabled={loading}
            className="link-button"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            disabled={loading}
            className="link-button"
          >
            Crear una cuenta
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;