// src/context/DrawerHooks.js
import { createContext, useContext } from 'react';

export const DrawerContext = createContext();

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};