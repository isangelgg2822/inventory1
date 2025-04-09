// src/context/DashboardContext.jsx
import { createContext, useCallback, useState } from 'react';
import { supabase } from '../supabase';

export const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [dailySalesTotal, setDailySalesTotal] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchDailySales = useCallback(async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Consultar las ventas no canceladas desde la tabla 'sales'
    const { data, error } = await supabase
      .from('sales')
      .select('total, created_at')
      .eq('is_canceled', false) // Filtrar solo ventas no canceladas
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (error) {
      console.error('Error fetching daily sales:', error);
      setDailySalesTotal(0);
      return;
    }

    const total = data && data.length > 0
      ? data.reduce((sum, sale) => sum + (sale.total || 0), 0)
      : 0;
    setDailySalesTotal(total);
  }, []);

  const fetchTotalProducts = useCallback(async () => {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total products:', error);
      setTotalProducts(0);
      return;
    }

    setTotalProducts(count || 0);
  }, []);

  const value = {
    dailySalesTotal,
    totalProducts,
    fetchDailySales,
    fetchTotalProducts,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}