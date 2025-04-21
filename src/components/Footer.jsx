import React from 'react';
import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        px: 1,
        mt: 'auto',
        backgroundColor: '#1a2526', // Coincide con el tema oscuro de tu Navbar
        color: '#ffffff',
        textAlign: 'center',
        position: 'fixed',
        bottom: 0,
        width: '100%',
        zIndex: 1000,
      }}
    >
      <Typography variant="body2">
        © 2025 Dxtodito C.A. | Creado por isangelnik@gmail.com
      </Typography>
    </Box>
  );
}

export default Footer;