import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Toolbar,
  AppBar,
} from '@mui/material';
import { supabase } from '../supabase';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout'; // Importar el ícono correcto

const drawerWidth = 240;

function Navbar({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userName, setUserName] = useState('Usuario');

  // Ajustar el estado inicial de 'open' según el tamaño del dispositivo
  useEffect(() => {
    if (isMobile) {
      setOpen(false); // Cerrado por defecto en dispositivos pequeños
    } else {
      setOpen(true); // Abierto por defecto en dispositivos grandes
    }
  }, [isMobile, setOpen]);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Error getting user:', authError);
          setUserName('Usuario');
          return;
        }

        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (userDataError || !userData) {
          console.error('Error fetching user data:', userDataError);
          setUserName('Usuario');
          return;
        }

        setUserName(userData.first_name || 'Usuario');
      } catch (error) {
        console.error('Unexpected error fetching user name:', error);
        setUserName('Usuario');
      }
    };

    fetchUserName();
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Inventario', icon: <StoreIcon />, path: '/inventory' },
    { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/pos' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Cerrar Sesión', icon: <LogoutIcon />, action: async () => {
      await supabase.auth.signOut();
      navigate('/login');
      if (isMobile) handleDrawerClose();
    }},
  ];

  return (
    <>
      {/* AppBar para mostrar el botón de menú en dispositivos pequeños */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: '#1a2526',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, display: open ? 'none' : 'block' }}
            >
              <MenuIcon sx={{ color: '#ffffff' }} />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, color: '#ffffff' }}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dxtodito C.A'}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={handleDrawerClose}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1a2526',
            borderRight: 'none',
            transition: 'width 0.3s ease-in-out',
            color: '#ffffff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        {/* Ajustar el espacio superior en dispositivos móviles para que el contenido del drawer no quede debajo del AppBar */}
        {isMobile && <Toolbar />}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            backgroundColor: '#263536',
            borderBottom: '1px solid #ffffff1a',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
            Dxtodito C.A
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff99' }}>
            Bienvenido, {userName}
          </Typography>
          {open && (
            <IconButton
              onClick={handleDrawerClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: isMobile ? 72 : 16, // Ajustar posición en móviles
                backgroundColor: '#ffffff1a',
                '&:hover': { backgroundColor: '#ffffff33' },
              }}
            >
              <ChevronLeftIcon sx={{ color: '#ffffff' }} />
            </IconButton>
          )}
        </Box>
        <Divider sx={{ backgroundColor: '#ffffff1a', my: 1 }} />

        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItem
              component="button"
              key={item.text}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  navigate(item.path);
                  if (isMobile) handleDrawerClose();
                }
              }}
              sx={{
                py: 1,
                px: 1.5,
                my: 0.5,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#263536',
                  borderLeft: '4px solid #42a5f5',
                  transition: 'all 0.2s ease-in-out',
                },
                backgroundColor: location.pathname === item.path ? '#1976d2' : 'transparent',
                borderLeft: location.pathname === item.path ? '4px solid #42a5f5' : 'none',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#ffffff' : '#ffffff99', minWidth: 48 }}>
                {React.cloneElement(item.icon, { sx: { fontSize: 32 } })}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  color: location.pathname === item.path ? '#ffffff' : '#ffffffcc',
                  '& .MuiTypography-root': { fontSize: '1.1rem', fontWeight: 500 },
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ backgroundColor: '#ffffff1a', my: 1 }} />
      </Drawer>
    </>
  );
}

export default Navbar;