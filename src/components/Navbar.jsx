// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Para detectar la ruta actual

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" sx={{ backgroundColor: '#fff', color: '#2d3748', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
            <StoreIcon />
          </Avatar>
          <Typography variant="h6" component="div">
            Mi Tienda
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            color="primary"
            component={Link}
            to="/inventory"
            sx={{
              bgcolor: isActive('/inventory') ? '#e3f2fd' : 'transparent',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            Inventario
          </Button>
          <Button
            color="primary"
            component={Link}
            to="/reports"
            sx={{
              bgcolor: isActive('/reports') ? '#e3f2fd' : 'transparent',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            Reportes
          </Button>
          <Button
            color="primary"
            component={Link}
            to="/pos"
            sx={{
              bgcolor: isActive('/pos') ? '#e3f2fd' : 'transparent',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            POS
          </Button>
          <Button
            color="primary"
            component={Link}
            to="/settings"
            sx={{
              bgcolor: isActive('/settings') ? '#e3f2fd' : 'transparent',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            Configuración
          </Button>
          <Button color="secondary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;