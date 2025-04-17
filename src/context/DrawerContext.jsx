// src/context/DrawerContext.jsx
import React, { useState } from 'react';
import { useMediaQuery } from '@mui/material';
import theme from '../theme';
import { DrawerContext } from './DrawerHooks';

function DrawerProvider({ children }) {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);
  console.log('DrawerProvider rendering - Providing context:', { open, setOpen, isMobile }); // Agrega este log para depurar

  return (
    <DrawerContext.Provider value={{ open, setOpen, isMobile }}>
      {children}
    </DrawerContext.Provider>
  );
}

export default DrawerProvider;