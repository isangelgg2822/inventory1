import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useDashboard } from '../context/DashboardHooks';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningIcon from '@mui/icons-material/Warning';
// Commented out chart imports to prevent unused imports
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   LineElement,
//   PointElement,
//   LinearScale,
//   Title,
//   CategoryScale,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// Commented out Chart.js registration since chart is not used
// ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

function Home() {
  const { fetchDailySales, fetchTotalProducts, /* fetchSalesLast7Days, */ fetchTotalSales } = useDashboard();
  const [dailySales, setDailySales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  // Commented out salesData state to prevent chart data fetching
  // const [salesData, setSalesData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchExchangeRate = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error('Error fetching exchange rate:', error);
      return;
    }
    if (data) {
      setExchangeRate(parseFloat(data.value) || 1);
    }
  }, []);

  const fetchLowStockProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('quantity');
    if (error) {
      console.error('Error fetching products for low stock:', error);
      return 0;
    }
    return data?.filter(product => product.quantity < 10).length || 0;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Home.jsx - Iniciando carga de datos...');
      const sales = await fetchDailySales();
      const products = await fetchTotalProducts();
      // Commented out fetchSalesLast7Days to prevent loading delays
      // const salesLast7Days = await fetchSalesLast7Days();
      const totalSalesAmount = await fetchTotalSales();
      const lowStock = await fetchLowStockProducts();
      console.log('Home.jsx - Datos obtenidos:', { sales, products, /* salesLast7Days, */ totalSalesAmount, lowStock });
      setDailySales(sales || 0);
      setTotalProducts(products || 0);
      // Commented out setSalesData since chart is not used
      // setSalesData(salesLast7Days.length ? salesLast7Days : [0, 0, 0, 0, 0, sales || 0, 0]);
      setTotalSales(totalSalesAmount || 0);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error loading data:', error);
      setDailySales(0);
      setTotalProducts(0);
      // Commented out setSalesData since chart is not used
      // setSalesData([0, 0, 0, 0, 0, 0, 0]);
      setTotalSales(0);
      setLowStockProducts(0);
    } finally {
      setLoading(false);
      console.log('Home.jsx - Carga de datos finalizada, loading:', false);
    }
  }, [fetchDailySales, fetchTotalProducts, /* fetchSalesLast7Days, */ fetchTotalSales, fetchLowStockProducts]);

  useEffect(() => {
    fetchExchangeRate();
    loadData();

    const salesSubscription = supabase
      .channel('public:sales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        console.log('Change received in sales:', payload);
        loadData();
      })
      .subscribe();

    const saleGroupsSubscription = supabase
      .channel('public:sale_groups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_groups' }, (payload) => {
        console.log('Change received in sale_groups:', payload);
        loadData();
      })
      .subscribe();

    const productsSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Change received in products:', payload);
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(salesSubscription);
      supabase.removeChannel(saleGroupsSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, [fetchExchangeRate, loadData]);

  const dailySalesUsd = dailySales / exchangeRate;

  // Commented out chart-related code to prevent rendering
  /*
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ventas Diarias (Bs.)',
        data: salesData,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#2d3748',
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: 'Tendencia de Ventas (Últimos 7 Días)',
        font: { size: 16 },
        color: '#2d3748',
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: '#2d3748',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ventas (Bs.)',
          color: '#2d3748',
          font: { size: 14 },
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#2d3748' },
      },
      x: {
        title: {
          display: true,
          text: 'Fecha',
          color: '#2d3748',
          font: { size: 14 },
        },
        grid: { display: false },
        ticks: { color: '#2d3748' },
      },
    },
  };
  */

  if (loading) {
    console.log('Home.jsx - Mostrando estado de carga...');
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6">Cargando...</Typography>
      </Box>
    );
  }

  console.log('Home.jsx - Renderizando contenido principal:', { dailySales, totalProducts, /* salesData, */ totalSales, lowStockProducts });

  return (
    <Container>
      <Typography variant="h2" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: 3, borderRadius: '12px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: '#1976d2' }} />
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Ventas Diarias
                </Typography>
                <Typography variant="h5" color="#2d3748">
                  Bs. {dailySales.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  USD {dailySalesUsd.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e0f7fa', boxShadow: 3, borderRadius: '12px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <InventoryIcon sx={{ fontSize: 40, color: '#0288d1' }} />
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total de Productos
                </Typography>
                <Typography variant="h5" color="#2d3748">
                  {totalProducts}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9', boxShadow: 3, borderRadius: '12px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ShoppingCartIcon sx={{ fontSize: 40, color: '#388e3c' }} />
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Ventas Totales
                </Typography>
                <Typography variant="h5" color="#2d3748">
                  Bs. {totalSales.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#ffebee', boxShadow: 3, borderRadius: '12px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Productos con Bajo Stock
                </Typography>
                <Typography variant="h5" color="#2d3748">
                  {lowStockProducts}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Commented out chart section to prevent rendering */}
      {/*
      <Card sx={{ p: 2, boxShadow: 3, borderRadius: '12px', maxWidth: '800px', mx: 'auto' }}>
        <Line data={chartData} options={chartOptions} />
      </Card>
      */}
    </Container>
  );
}

export default Home;