// src/components/Home.jsx
import { useEffect } from 'react';
import Navbar from './Navbar';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid, // Importamos Grid desde @mui/material
  Divider,
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useDashboard } from '../context/DashboardHooks';

function Home() {
  const { dailySalesTotal, totalProducts, fetchDailySales, fetchTotalProducts } = useDashboard();

  useEffect(() => {
    fetchDailySales();
    fetchTotalProducts();
  }, [fetchDailySales, fetchTotalProducts]);

  return (
    <>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: '240px' },
          mt: { xs: 2, sm: 0 },
          width: { xs: '100%', sm: 'calc(100% - 240px)' },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 'bold',
              color: '#1976d2',
            }}
          >
            Dashboard
          </Typography>
          <Divider sx={{ mb: 4 }} />
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MonetizationOnIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      Ventas del Día
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      Bs. {dailySalesTotal.toFixed(2)}
                    </Typography>
                    <Typography color="text.secondary">
                      Ingresos totales de hoy
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InventoryIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      Productos Registrados
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {totalProducts}
                    </Typography>
                    <Typography color="text.secondary">
                      Total de productos en inventario
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}

export default Home;