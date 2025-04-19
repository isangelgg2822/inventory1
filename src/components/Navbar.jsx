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
} from '@mui/material';
import { supabase } from '../supabase';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const drawerWidth = 240;

function Navbar({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userName, setUserName] = useState('Usuario');

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

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Inventario', icon: <StoreIcon />, path: '/inventory' },
    { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/pos' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
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
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)', // Sombra para profundidad
        },
      }}
    >
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
              top: 16,
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
              navigate(item.path);
              if (isMobile) handleDrawerClose();
            }}
            sx={{
              py: 1.5,
              px: 2,
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
              {React.cloneElement(item.icon, { sx: { fontSize: 28 } })}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                color: location.pathname === item.path ? '#ffffff' : '#ffffffcc',
                '& .MuiTypography-root': { fontSize: '1rem', fontWeight: 500 },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ backgroundColor: '#ffffff1a', my: 1 }} />
    </Drawer>
  );
}

export default Navbar;