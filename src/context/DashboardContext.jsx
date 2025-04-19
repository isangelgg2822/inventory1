import React from 'react';
import { supabase } from '../supabase';
import { DashboardContext } from './DashboardHooks';

function DashboardProvider({ children }) {
  const fetchDailySales = async () => {
    try {
      console.log('Fetching daily sales...');
      const today = new Date().toISOString().split('T')[0];
      const { data: saleGroups, error: groupsError } = await supabase
        .from('sale_groups')
        .select('sale_group_id, total, created_at')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      if (groupsError) throw groupsError;

      if (!saleGroups || saleGroups.length === 0) {
        return 0;
      }

      const saleGroupIds = saleGroups.map(group => group.sale_group_id);
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sale_group_id, is_canceled')
        .in('sale_group_id', saleGroupIds);

      if (salesError) throw salesError;

      const canceledSaleGroups = new Set();
      const saleGroupCancellationStatus = sales.reduce((acc, sale) => {
        if (!acc[sale.sale_group_id]) {
          acc[sale.sale_group_id] = { allCanceled: true, hasSales: true };
        }
        if (!sale.is_canceled) {
          acc[sale.sale_group_id].allCanceled = false;
        }
        return acc;
      }, {});

      Object.keys(saleGroupCancellationStatus).forEach(groupId => {
        if (saleGroupCancellationStatus[groupId].allCanceled) {
          canceledSaleGroups.add(groupId);
        }
      });

      const activeSaleGroups = saleGroups.filter(group => !canceledSaleGroups.has(group.sale_group_id));
      const dailyTotal = activeSaleGroups.reduce((sum, group) => sum + (group.total || 0), 0);
      return dailyTotal;
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      return 0;
    }
  };

  const fetchTotalProducts = async () => {
    try {
      console.log('Fetching total products...');
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' });
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching total products:', error);
      return 0;
    }
  };

  // Commenting out fetchSalesLast7Days to prevent loading delays
  /*
  const fetchSalesLast7Days = async () => {
    try {
      console.log('Fetching sales for the last 7 days...');
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const { data: saleGroups, error: groupsError } = await supabase
        .from('sale_groups')
        .select('sale_group_id, total, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .lte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (groupsError) throw groupsError;

      if (!saleGroups || saleGroups.length === 0) {
        return Array(7).fill(0);
      }

      const saleGroupIds = saleGroups.map(group => group.sale_group_id);
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sale_group_id, is_canceled')
        .in('sale_group_id', saleGroupIds);

      if (salesError) throw salesError;

      const canceledSaleGroups = new Set();
      const saleGroupCancellationStatus = sales.reduce((acc, sale) => {
        if (!acc[sale.sale_group_id]) {
          acc[sale.sale_group_id] = { allCanceled: true, hasSales: true };
        }
        if (!sale.is_canceled) {
          acc[sale.sale_group_id].allCanceled = false;
        }
        return acc;
      }, {});

      Object.keys(saleGroupCancellationStatus).forEach(groupId => {
        if (saleGroupCancellationStatus[groupId].allCanceled) {
          canceledSaleGroups.add(groupId);
        }
      });

      const activeSaleGroups = saleGroups.filter(group => !canceledSaleGroups.has(group.sale_group_id));

      const salesByDay = Array(7).fill(0);
      const startDate = sevenDaysAgo.setHours(0, 0, 0, 0);
      activeSaleGroups.forEach((group) => {
        const saleDate = new Date(group.created_at).setHours(0, 0, 0, 0);
        const dayIndex = Math.floor((saleDate - startDate) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          salesByDay[dayIndex] += group.total || 0;
        }
      });

      return salesByDay;
    } catch (error) {
      console.error('Error fetching sales for the last 7 days:', error);
      return Array(7).fill(0);
    }
  };
  */

  const fetchTotalSales = async () => {
    try {
      console.log('Fetching total sales...');
      const { data: saleGroups, error: groupsError } = await supabase
        .from('sale_groups')
        .select('sale_group_id, total');

      if (groupsError) throw groupsError;

      if (!saleGroups || saleGroups.length === 0) {
        return 0;
      }

      const saleGroupIds = saleGroups.map(group => group.sale_group_id);
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sale_group_id, is_canceled')
        .in('sale_group_id', saleGroupIds);

      if (salesError) throw salesError;

      const canceledSaleGroups = new Set();
      const saleGroupCancellationStatus = sales.reduce((acc, sale) => {
        if (!acc[sale.sale_group_id]) {
          acc[sale.sale_group_id] = { allCanceled: true, hasSales: true };
        }
        if (!sale.is_canceled) {
          acc[sale.sale_group_id].allCanceled = false;
        }
        return acc;
      }, {});

      Object.keys(saleGroupCancellationStatus).forEach(groupId => {
        if (saleGroupCancellationStatus[groupId].allCanceled) {
          canceledSaleGroups.add(groupId);
        }
      });

      const activeSaleGroups = saleGroups.filter(group => !canceledSaleGroups.has(group.sale_group_id));
      const total = activeSaleGroups.reduce((sum, group) => sum + (group.total || 0), 0);
      return total;
    } catch (error) {
      console.error('Error fetching total sales:', error);
      return 0;
    }
  };

  // Commented out fetchSalesLast7Days in the value object to prevent its usage
  const value = { fetchDailySales, fetchTotalProducts, /* fetchSalesLast7Days, */ fetchTotalSales };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export default DashboardProvider;