import React, { useState } from 'react';
import { supabase } from '../../supabase';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { CSVLink } from 'react-csv';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import BarChartIcon from '@mui/icons-material/BarChart';

// Registrar los componentes de Chart.js
ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

function Reports() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState({});
  const [canceledSalesSummary, setCanceledSalesSummary] = useState({});

  const fetchSalesByPeriod = async () => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona un rango de fechas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const start = new Date(startDate).toISOString().split('T')[0];
      const end = new Date(endDate).toISOString().split('T')[0];

      const { data: saleGroups, error: groupsError } = await supabase
        .from('sale_groups')
        .select('sale_group_id, total, payment_method, created_at')
        .gte('created_at', `${start}T00:00:00.000Z`)
        .lte('created_at', `${end}T23:59:59.999Z`)
        .order('created_at', { ascending: true });

      if (groupsError) {
        console.error('Error fetching sale_groups:', groupsError);
        throw new Error(`Error al cargar sale_groups: ${groupsError.message} (Código: ${groupsError.code})`);
      }

      if (!saleGroups || saleGroups.length === 0) {
        setSalesData([]);
        setTotalSales(0);
        setPaymentSummary({});
        setCanceledSalesSummary({});
        setError('No se encontraron ventas en el rango de fechas seleccionado.');
        setLoading(false);
        return;
      }

      const saleGroupIds = saleGroups.map(group => group.sale_group_id);
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sale_group_id, is_canceled')
        .in('sale_group_id', saleGroupIds);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw new Error(`Error al cargar sales: ${salesError.message} (Código: ${salesError.code})`);
      }

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
      const canceledSaleGroupsList = saleGroups.filter(group => canceledSaleGroups.has(group.sale_group_id));

      const salesByDate = activeSaleGroups.reduce((acc, group) => {
        const date = group.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += group.total || 0;
        return acc;
      }, {});

      const formattedSalesData = Object.entries(salesByDate).map(([date, total]) => ({
        date,
        total,
      }));

      const total = formattedSalesData.reduce((sum, sale) => sum + sale.total, 0);
      setSalesData(formattedSalesData);
      setTotalSales(total);

      const paymentSummary = activeSaleGroups.reduce((acc, group) => {
        const method = group.payment_method || 'Desconocido';
        if (!acc[method]) {
          acc[method] = { total: 0, transactions: 0 };
        }
        acc[method].total += group.total || 0;
        acc[method].transactions += 1;
        return acc;
      }, {});
      setPaymentSummary(paymentSummary);

      const canceledSummary = canceledSaleGroupsList.reduce((acc, group) => {
        const method = group.payment_method || 'Desconocido';
        if (!acc[method]) {
          acc[method] = { total: 0, transactions: 0 };
        }
        acc[method].total += group.total || 0;
        acc[method].transactions += 1;
        return acc;
      }, {});
      setCanceledSalesSummary(canceledSummary);
    } catch (error) {
      console.error('Error fetching sales by period:', error);
      setError(`Error al cargar los datos de ventas: ${error.message}. Por favor, intenta de nuevo.`);
      setSalesData([]);
      setTotalSales(0);
      setPaymentSummary({});
      setCanceledSalesSummary({});
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: salesData.map((sale) => sale.date),
    datasets: [
      {
        label: 'Ventas Diarias (Bs.)',
        data: salesData.map((sale) => sale.total),
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
        text: 'Ventas por Período',
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

  const csvData = salesData.map((sale) => ({
    Fecha: sale.date,
    'Ventas (Bs.)': sale.total,
  }));

  const paymentCsvData = Object.entries(paymentSummary).map(([method, data]) => ({
    'Método de Pago': method,
    'Total (Bs.)': data.total.toFixed(2),
    'Transacciones': data.transactions,
  }));

  const canceledCsvData = Object.entries(canceledSalesSummary).map(([method, data]) => ({
    'Método de Pago': method,
    'Total Anulado (Bs.)': data.total.toFixed(2),
    'Transacciones Anuladas': data.transactions,
  }));

  return (
    <Container>
      <Typography variant="h2" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
        Reportes
      </Typography>

      <Box sx={{ mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: '12px', boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
          Ventas por Período
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Fecha de Inicio"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Fecha de Fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchSalesByPeriod}
                disabled={loading}
                startIcon={<BarChartIcon />}
                sx={{ height: '56px', py: 1.5, px: 3 }}
              >
                {loading ? 'Cargando...' : 'Generar Reporte'}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>

        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}

        {salesData.length > 0 && (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: 3, borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      Total de Ventas
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      Bs. {totalSales.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ backgroundColor: '#e0f7fa', boxShadow: 3, borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      Promedio Diario
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#0288d1', fontWeight: 'bold' }}>
                      Bs. {(totalSales / salesData.length).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
              <Card sx={{ boxShadow: 3, borderRadius: '12px', p: 2 }}>
                <Line data={chartData} options={chartOptions} />
              </Card>
            </Box>

            {Object.keys(paymentSummary).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
                  Resumen por Método de Pago
                </Typography>
                <Table sx={{ mb: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Método de Pago</TableCell>
                      <TableCell>Total (Bs.)</TableCell>
                      <TableCell>Transacciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(paymentSummary).map(([method, data]) => (
                      <TableRow key={method}>
                        <TableCell>{method}</TableCell>
                        <TableCell>{data.total.toFixed(2)}</TableCell>
                        <TableCell>{data.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' }}
                >
                  <CSVLink
                    data={paymentCsvData}
                    filename={`resumen-metodos-pago-${startDate?.toISOString().split('T')[0]}-a-${endDate?.toISOString().split('T')[0]}.csv`}
                    style={{ textDecoration: 'none', color: '#fff' }}
                  >
                    Exportar Resumen a CSV
                  </CSVLink>
                </Button>
              </Box>
            )}

            {Object.keys(canceledSalesSummary).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
                  Resumen de Ventas Anuladas
                </Typography>
                <Table sx={{ mb: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Método de Pago</TableCell>
                      <TableCell>Total Anulado (Bs.)</TableCell>
                      <TableCell>Transacciones Anuladas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(canceledSalesSummary).map(([method, data]) => (
                      <TableRow key={method}>
                        <TableCell>{method}</TableCell>
                        <TableCell>{data.total.toFixed(2)}</TableCell>
                        <TableCell>{data.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' }}
                >
                  <CSVLink
                    data={canceledCsvData}
                    filename={`resumen-ventas-anuladas-${startDate?.toISOString().split('T')[0]}-a-${endDate?.toISOString().split('T')[0]}.csv`}
                    style={{ textDecoration: 'none', color: '#fff' }}
                  >
                    Exportar Anulaciones a CSV
                  </CSVLink>
                </Button>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' }}
            >
              <CSVLink
                data={csvData}
                filename={`reporte-ventas-${startDate?.toISOString().split('T')[0]}-a-${endDate?.toISOString().split('T')[0]}.csv`}
                style={{ textDecoration: 'none', color: '#fff' }}
              >
                Exportar Ventas a CSV
              </CSVLink>
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}

export default Reports;