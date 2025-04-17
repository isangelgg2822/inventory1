import React from 'react';
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const drawerWidth = 240;

function Navbar({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between', backgroundColor: '#263536' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
          Dxtodito C.A
        </Typography>
        {open && (
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon sx={{ color: '#ffffff' }} />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ backgroundColor: '#ffffff33' }} />

      <Typography
        variant="caption"
        sx={{ pl: 2, pt: 2, pb: 1, color: '#ffffff99', fontWeight: 'bold' }}
      >
        ADMINISTRAR
      </Typography>
      <List>
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
              '&:hover': {
                backgroundColor: '#263536',
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease-in-out',
              },
              backgroundColor: location.pathname === item.path ? '#1976d2' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              borderBottom: 'none',
              borderTop: 'none',
              borderRight: 'none',
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? '#ffffff' : '#ffffff99', minWidth: 40 }}>
              {React.cloneElement(item.icon, { sx: { fontSize: 28 } })}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                color: location.pathname === item.path ? '#ffffff' : '#ffffffcc',
                '& .MuiTypography-root': { fontSize: '1.1rem' },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ backgroundColor: '#ffffff33', my: 1 }} />
    </Drawer>
  );
}

export default Navbar;