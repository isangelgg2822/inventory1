import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';

function TopBar({ onDrawerOpen }) {
  const [userName, setUserName] = useState('Usuario');
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Error getting user:', authError);
          setUserName('Usuario');
          navigate('/login');
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
  }, [navigate]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    handleMenuClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1a2526', // Coincide con el fondo del Drawer
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onDrawerOpen}
          sx={{ mr: 2, display: { sm: 'none' } }} // Solo visible en móviles
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
          Dxtodito C.A
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mr: 1, color: '#ffffff' }}>
            {userName}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={handleMenuOpen}
          >
            <AccountCircleIcon sx={{ color: '#ffffff' }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;