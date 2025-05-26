import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { startOfDay, endOfDay, format } from 'date-fns';
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
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Filler,
} from 'chart.js';
import { CSVLink } from 'react-csv';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import BarChartIcon from '@mui/icons-material/BarChart';
import Navbar from '../Navbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Registrar los componentes de Chart.js
ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler);

// Lista predefinida de métodos de pago basada en el Carrito
const PAYMENT_METHODS = [
  'Efectivo Bs',
  'Divisa',
  'Débito',
  'Biopago',
  'Pago Móvil',
  'Avance de Efectivo',
];

function Reports() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState({});
  const [canceledSalesSummary, setCanceledSalesSummary] = useState({});
  const [open, setOpen] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

  const handleDateRangeChange = (option) => {
    setDateRangeOption(option);
    const today = new Date();
    let newStartDate = null;
    let newEndDate = today;

    switch (option) {
      case 'last7Days':
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 7);
        break;
      case 'last30Days':
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        newStartDate = null;
        newEndDate = null;
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const fetchSalesByPeriod = async () => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona un rango de fechas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Asegurarnos de que startDate y endDate sean objetos Date válidos
      const startLocal = startDate instanceof Date ? startDate : new Date(startDate);
      const endLocal = endDate instanceof Date ? endDate : new Date(endDate);

      if (isNaN(startLocal) || isNaN(endLocal)) {
        throw new Error('Fechas inválidas seleccionadas.');
      }

      // Ajustamos las fechas al principio y final del día (en la zona horaria local del navegador)
      const start = startOfDay(startLocal).toISOString();
      const end = endOfDay(endLocal).toISOString();
      console.log('Query Range:', `${start} to ${end}`);

      // Seleccionamos los campos adicionales para los métodos de pago
      let query = supabase
        .from('sale_groups')
        .select('sale_group_id, total, payment_method, primary_payment_method, paid_amount, secondary_payment_method, second_paid_amount, created_at')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

      // Filtrar por método de pago (considerando principal y secundario)
      if (paymentMethodFilter) {
        query = query.or(
          `primary_payment_method.eq.${paymentMethodFilter},secondary_payment_method.eq.${paymentMethodFilter}`
        );
      }

      const { data: saleGroups, error: groupsError } = await query;
      console.log('Sale Groups Retrieved:', saleGroups);

      if (groupsError) {
        throw new Error(`Error al cargar sale_groups: ${groupsError.message}`);
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
        throw new Error(`Error al cargar sales: ${salesError.message}`);
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

      // Agrupamos las ventas por fecha usando las fechas devueltas por Supabase
      const salesByDate = activeSaleGroups.reduce((acc, group) => {
        try {
          const date = new Date(group.created_at);
          if (isNaN(date)) {
            console.warn('Fecha inválida en created_at:', group.created_at);
            return acc;
          }

          // Supabase devuelve created_at ajustado a America/Caracas, así que lo usamos directamente
          const dateString = format(date, 'dd/MM/yyyy');

          if (!acc[dateString]) {
            acc[dateString] = 0;
          }
          acc[dateString] += group.total || 0;
          return acc;
        } catch (err) {
          console.error('Error al procesar fecha:', group.created_at, err);
          return acc;
        }
      }, {});

      const formattedSalesData = Object.entries(salesByDate).map(([date, total]) => ({
        date,
        total,
      }));

      const total = formattedSalesData.reduce((sum, sale) => sum + sale.total, 0);
      setSalesData(formattedSalesData);
      setTotalSales(total);

      // Procesar resumen por método de pago para ventas activas
      const paymentSummary = activeSaleGroups.reduce((acc, group) => {
        // Manejar compatibilidad con ventas antiguas
        const isLegacySale = !group.primary_payment_method && !group.paid_amount;
        
        // Método principal
        const primaryMethod = isLegacySale
          ? group.payment_method || 'Desconocido'
          : group.primary_payment_method || group.payment_method || 'Desconocido';
        const primaryAmount = isLegacySale
          ? group.total || 0
          : parseFloat(group.paid_amount) || 0;

        if (!acc[primaryMethod]) {
          acc[primaryMethod] = { total: 0, transactions: 0 };
        }
        acc[primaryMethod].total += primaryAmount;
        acc[primaryMethod].transactions += 1;

        // Método secundario (si existe)
        if (group.secondary_payment_method) {
          const secondaryMethod = group.secondary_payment_method || 'Desconocido';
          const secondaryAmount = parseFloat(group.second_paid_amount) || 0;

          if (!acc[secondaryMethod]) {
            acc[secondaryMethod] = { total: 0, transactions: 0 };
          }
          acc[secondaryMethod].total += secondaryAmount;
          acc[secondaryMethod].transactions += 1;
        }

        return acc;
      }, {});
      setPaymentSummary(paymentSummary);

      // Procesar resumen de ventas anuladas
      const canceledSummary = canceledSaleGroupsList.reduce((acc, group) => {
        // Manejar compatibilidad con ventas antiguas
        const isLegacySale = !group.primary_payment_method && !group.paid_amount;

        // Método principal
        const primaryMethod = isLegacySale
          ? group.payment_method || 'Desconocido'
          : group.primary_payment_method || group.payment_method || 'Desconocido';
        const primaryAmount = isLegacySale
          ? group.total || 0
          : parseFloat(group.paid_amount) || 0;

        if (!acc[primaryMethod]) {
          acc[primaryMethod] = { total: 0, transactions: 0 };
        }
        acc[primaryMethod].total += primaryAmount;
        acc[primaryMethod].transactions += 1;

        // Método secundario (si existe)
        if (group.secondary_payment_method) {
          const secondaryMethod = group.secondary_payment_method || 'Desconocido';
          const secondaryAmount = parseFloat(group.second_paid_amount) || 0;

          if (!acc[secondaryMethod]) {
            acc[secondaryMethod] = { total: 0, transactions: 0 };
          }
          acc[secondaryMethod].total += secondaryAmount;
          acc[secondaryMethod].transactions += 1;
        }

        return acc;
      }, {});
      setCanceledSalesSummary(canceledSummary);
    } catch (error) {
      console.error('Error en fetchSalesByPeriod:', error);
      setError(`Error al cargar los datos de ventas: ${error.message}. Por favor, intenta de nuevo.`);
      setSalesData([]);
      setTotalSales(0);
      setPaymentSummary({});
      setCanceledSalesSummary({});
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {});

    doc.setFontSize(18);
    doc.text('Reporte de Ventas', 14, 22);

    doc.setFontSize(12);
    doc.text(
      `Período: ${startDate ? format(startDate, 'yyyy-MM-dd') : ''} a ${endDate ? format(endDate, 'yyyy-MM-dd') : ''}`,
      14,
      32
    );

    doc.setFontSize(12);
    doc.text(`Total de Ventas: Bs. ${totalSales.toFixed(2)}`, 14, 42);
    doc.text(
      `Promedio Diario: Bs. ${(totalSales / salesData.length || 0).toFixed(2)}`,
      14,
      52
    );

    if (salesData.length > 0) {
      doc.setFontSize(14);
      doc.text('Ventas Diarias', 14, 70);
      autoTable(doc, {
        startY: 80,
        head: [['Fecha', 'Ventas (Bs.)']],
        body: salesData.map(sale => [sale.date, sale.total.toFixed(2)]),
      });
    }

    if (Object.keys(paymentSummary).length > 0) {
      doc.setFontSize(14);
      doc.text('Resumen por Método de Pago', 14, doc.lastAutoTable.finalY + 20);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Método de Pago', 'Total (Bs.)', 'Transacciones']],
        body: Object.entries(paymentSummary).map(([method, data]) => [
          method,
          data.total.toFixed(2),
          data.transactions,
        ]),
      });
    }

    if (Object.keys(canceledSalesSummary).length > 0) {
      doc.setFontSize(14);
      doc.text('Resumen de Ventas Anuladas', 14, doc.lastAutoTable.finalY + 20);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Método de Pago', 'Total Anulado (Bs.)', 'Transacciones Anuladas']],
        body: Object.entries(canceledSalesSummary).map(([method, data]) => [
          method,
          data.total.toFixed(2),
          data.transactions,
        ]),
      });
    }

    doc.save(`reporte-ventas-${startDate ? format(startDate, 'yyyy-MM-dd') : 'inicio'}-a-${endDate ? format(endDate, 'yyyy-MM-dd') : 'fin'}.pdf`);
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
    <>
      <Navbar open={open} setOpen={setOpen} />
      <Container sx={{ mt: { xs: 8, sm: 0 } }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '2rem', fontWeight: 600 }}>
          Reportes
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: '12px', boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
            Ventas por Período
          </Typography>
          <Grid
            container
            spacing={2}
            sx={{
              mb: 2,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Rango de Fechas</InputLabel>
                <Select
                  value={dateRangeOption}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  label="Rango de Fechas"
                >
                  <MenuItem value="">Seleccionar Manualmente</MenuItem>
                  <MenuItem value="last7Days">Últimos 7 Días</MenuItem>
                  <MenuItem value="last30Days">Últimos 30 Días</MenuItem>
                  <MenuItem value="thisMonth">Este Mes</MenuItem>
                  <MenuItem value="lastMonth">Mes Pasado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: { xs: '1 / 2', sm: '2 / 3', md: '1 / 2', lg: '2 / 3' } }}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  label="Método de Pago"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: { xs: '1 / 2', sm: '3 / 4', md: '2 / 3', lg: '3 / 4' } }} />
          </Grid>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid
              container
              spacing={2}
              sx={{
                mb: 2,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              <Grid>
                <DatePicker
                  label="Fecha de Inicio"
                  value={startDate}
                  onChange={(newValue) => {
                    setStartDate(newValue);
                    setDateRangeOption('');
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: '1 / 2', sm: '2 / 3', md: '1 / 2', lg: '2 / 3' } }}>
                <DatePicker
                  label="Fecha de Fin"
                  value={endDate}
                  onChange={(newValue) => {
                    setEndDate(newValue);
                    setDateRangeOption('');
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid sx={{ gridColumn: { xs: '1 / 2', sm: '3 / 4', md: '2 / 3', lg: '3 / 4' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={fetchSalesByPeriod}
                  disabled={loading}
                  startIcon={<BarChartIcon />}
                  sx={{ height: '56px', py: 1.5, px: 3, width: '100%' }}
                >
                  {loading ? 'Cargando...' : 'Generar Reporte'}
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {salesData.length > 0 && (
            <>
              <Grid
                container
                spacing={3}
                sx={{
                  mb: 4,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                  },
                  gap: 3,
                }}
              >
                <Grid>
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
                <Grid>
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
                    sx={{ mt: 2, mr: 2, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' }}
                  >
                    <CSVLink
                      data={paymentCsvData}
                      filename={`resumen-metodos-pago-${startDate ? format(startDate, 'yyyy-MM-dd') : 'inicio'}-a-${endDate ? format(endDate, 'yyyy-MM-dd') : 'fin'}.csv`}
                      style={{ textDecoration: 'none', color: '#fff' }}
                    >
                      Exportar Resumen a CSV
                    </CSVLink>
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={exportToPDF}
                    sx={{ mt: 2, background: 'linear-gradient(90deg, #d81b60, #f06292)' }}
                  >
                    Exportar Resumen a PDF
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
                    sx={{ mt: 2, mr: 2, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' }}
                  >
                    <CSVLink
                      data={canceledCsvData}
                      filename={`resumen-ventas-anuladas-${startDate ? format(startDate, 'yyyy-MM-dd') : 'inicio'}-a-${endDate ? format(endDate, 'yyyy-MM-dd') : 'fin'}.csv`}
                      style={{ textDecoration: 'none', color: '#fff' }}
                    >
                      Exportar Anulaciones a CSV
                    </CSVLink>
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={exportToPDF}
                    sx={{ mt: 2, background: 'linear-gradient(90deg, #d81b60, #f06292)' }}
                  >
                    Exportar Anulaciones a PDF
                  </Button>
                </Box>
              )}

              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, mr: 2, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' }}
              >
                <CSVLink
                  data={csvData}
                  filename={`reporte-ventas-${startDate ? format(startDate, 'yyyy-MM-dd') : 'inicio'}-a-${endDate ? format(endDate, 'yyyy-MM-dd') : 'fin'}.csv`}
                  style={{ textDecoration: 'none', color: '#fff' }}
                >
                  Exportar Ventas a CSV
                </CSVLink>
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={exportToPDF}
                sx={{ mt: 2, background: 'linear-gradient(90deg, #d81b60, #f06292)' }}
              >
                Exportar Ventas a PDF
              </Button>
            </>
          )}
        </Box>
      </Container>
    </>
  );
}

export default Reports;