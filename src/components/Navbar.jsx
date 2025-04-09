// src/components/Navbar.jsx
import { useState } from 'react';
import { supabase } from '../supabase';
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
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const drawerWidth = 240;

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      alert('Error al cerrar sesión');
      return;
    }
    navigate('/login');
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Inventario', icon: <StoreIcon />, path: '/inventory' },
    { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/pos' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerOpen}
          sx={{ position: 'fixed', top: 10, left: 10, zIndex: 1200 }}
        >
          <MenuIcon />
        </IconButton>
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
            backgroundColor: '#f9fafb',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827' }}>
            Mi Tienda
          </Typography>
          {open && (
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
        <Divider />

        <Typography
          variant="caption"
          sx={{ pl: 2, pt: 2, pb: 1, color: '#6b7280', fontWeight: 'bold' }}
        >
          MANAGE
        </Typography>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) handleDrawerClose();
              }}
              sx={{
                '&:hover': { backgroundColor: '#e5e7eb' },
                backgroundColor: location.pathname === item.path ? '#e5e7eb' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: '#6b7280' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: '#111827' }} />
            </ListItem>
          ))}
        </List>

        <Typography
          variant="caption"
          sx={{ pl: 2, pt: 2, pb: 1, color: '#6b7280', fontWeight: 'bold' }}
        >
          CONFIGURATION
        </Typography>
        <List>
          <ListItem
            button
            onClick={handleSignOut}
            sx={{ '&:hover': { backgroundColor: '#e5e7eb' } }}
          >
            <ListItemIcon sx={{ color: '#6b7280' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" sx={{ color: '#111827' }} />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}

export default Navbar;