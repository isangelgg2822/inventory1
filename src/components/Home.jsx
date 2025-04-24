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
  Button,
  Alert,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { fetchDailySales, fetchTotalProducts, fetchTotalSales } = useDashboard();
  const [dailySales, setDailySales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRateWarning, setExchangeRateWarning] = useState(null); // Nuevo estado para advertencia
  const navigate = useNavigate();

  const fetchExchangeRate = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      setError('No se pudo autenticar el usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Primero intenta obtener la tasa de cambio global
    let data, error;
    ({ data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .is('user_id', null)
      .maybeSingle());

    if (error) {
      console.error('Error fetching global exchange rate:', error);
      setError(`Error al recuperar la tasa de cambio global: ${error.message}`);
      return;
    }

    if (!data) {
      // Si no hay tasa global, busca una tasa específica del usuario
      ({ data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'exchange_rate')
        .eq('user_id', user.id)
        .maybeSingle());
      if (error) {
        console.error('Error fetching user exchange rate:', error);
        setError(`Error al recuperar la tasa de cambio del usuario: ${error.message}`);
        return;
      }
    }

    if (data) {
      setExchangeRate(parseFloat(data.value) || 1);
      setExchangeRateWarning(null); // Limpiar advertencia si se encuentra una tasa
    } else {
      setExchangeRate(1); // Valor por defecto
      setExchangeRateWarning('No se encontró una tasa de cambio. Las ventas en USD se calcularán con una tasa de 1. Configúrala en ajustes.');
    }
  }, [setError]);

  const fetchLowStockProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('quantity');
    if (error) {
      console.error('Error fetching products for low stock:', error);
      if (error.message.includes('No API key found')) {
        setError('Error de autenticación con la API. Por favor, revisa la configuración del cliente.');
      } else {
        setError(`Error al recuperar productos con bajo stock: ${error.message}`);
      }
      return 0;
    }
    return data?.filter(product => product.quantity < 10).length || 0;
  }, [setError]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Home.jsx - Iniciando carga de datos...');
      const sales = await fetchDailySales();
      const products = await fetchTotalProducts();
      const totalSalesAmount = await fetchTotalSales();
      const lowStock = await fetchLowStockProducts();
      console.log('Home.jsx - Datos obtenidos:', { sales, products, totalSalesAmount, lowStock });
      setDailySales(sales || 0);
      setTotalProducts(products || 0);
      setTotalSales(totalSalesAmount || 0);
      setLowStockProducts(lowStock);
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setDailySales(0);
      setTotalProducts(0);
      setTotalSales(0);
      setLowStockProducts(0);
      setError('Error al cargar los datos del dashboard. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
      console.log('Home.jsx - Carga de datos finalizada, loading:', false);
    }
  }, [fetchDailySales, fetchTotalProducts, fetchTotalSales, fetchLowStockProducts]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchExchangeRate();
        await loadData();
      } catch (error) {
        console.error('Error during initialization:', error);
        setError('Error al inicializar los datos. Por favor, revisa tu conexión o la configuración.');
      }
    };

    initializeData();

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

  if (error) {
    return (
      <Container sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '2rem', fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Box sx={{ backgroundColor: '#ffebee', p: { xs: 2, sm: 3 }, borderRadius: '12px', mb: 2 }}>
          <Typography variant="h6" color="error" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            {error}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/settings')}
          sx={{ py: 1, px: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
        >
          Ir a Configuración
        </Button>
      </Container>
    );
  }

  if (loading) {
    console.log('Home.jsx - Mostrando estado de carga...');
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6">Cargando...</Typography>
      </Box>
    );
  }

  console.log('Home.jsx - Renderizando contenido principal:', { dailySales, totalProducts, totalSales, lowStockProducts });

  return (
    <Container>
      <Typography variant="h2" gutterBottom sx={{ fontSize: '2rem', fontWeight: 600 }}>
        Dashboard
      </Typography>

      {exchangeRateWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {exchangeRateWarning}
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={() => navigate('/settings')}
            sx={{ ml: 2 }}
          >
            Configurar
          </Button>
        </Alert>
      )}

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
              <InventoryIcon sx={{ fontSize: 30, color: '#0288d1' }} />
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
              <ShoppingCartIcon sx={{ fontSize: 30, color: '#388e3c' }} />
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
              <WarningIcon sx={{ fontSize: 30, color: '#d32f2f' }} />
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
    </Container>
  );
}

export default Home;