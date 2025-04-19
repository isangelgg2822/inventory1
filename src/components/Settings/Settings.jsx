import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Navbar from '../Navbar';
import { useDrawer } from '../../context/DrawerHooks';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const { open } = useDrawer();
  const navigate = useNavigate();
  const [exchangeRate, setExchangeRate] = useState('');
  const [previousExchangeRate, setPreviousExchangeRate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        setError('No se pudo autenticar el usuario. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      fetchExchangeRate(user);
      fetchExchangeRateHistory(user);
      fetchRateHistory(user);
    };
    checkAuthAndFetchData();
  }, [navigate]);

  const fetchExchangeRate = async (user) => {
    const { data, error } = await supabase
      .from('settings')
      .select('value, updated_at')
      .eq('key', 'exchange_rate')
      .eq('user_id', user.id);
    if (error) {
      console.error('Error fetching exchange rate:', error);
      setError('Error al obtener la tasa de cambio: ' + error.message);
      return;
    }
    if (data && data.length > 0) {
      setExchangeRate(data[0].value || '');
      setLastUpdated(data[0].updated_at ? new Date(data[0].updated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : null);
    } else {
      setExchangeRate('');
      setLastUpdated(null);
    }
  };

  const fetchExchangeRateHistory = async (user) => {
    const { data, error } = await supabase
      .from('exchange_rate_history')
      .select('exchange_rate')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(2);
    if (error) {
      console.error('Error fetching exchange rate history:', error);
      setPreviousExchangeRate(null);
      return;
    }
    if (data && data.length > 1) {
      setPreviousExchangeRate(data[1].exchange_rate);
    } else {
      setPreviousExchangeRate(null);
    }
  };

  const fetchRateHistory = async (user) => {
    const { data, error } = await supabase
      .from('exchange_rate_history')
      .select('exchange_rate, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);
    if (error) {
      console.error('Error fetching rate history:', error);
      setRateHistory([]);
      return;
    }
    setRateHistory(data || []);
  };

  const saveExchangeRate = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError('No se pudo autenticar el usuario. Por favor, inicia sesión nuevamente.');
      navigate('/login');
      return;
    }

    const { data } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'exchange_rate')
      .eq('user_id', user.id);

    if (data && data.length > 0) {
      const { error } = await supabase
        .from('settings')
        .update({ value: exchangeRate, updated_at: new Date().toISOString() })
        .eq('id', data[0].id);
      if (error) {
        console.error('Error updating exchange rate:', error);
        setError('Error al actualizar la tasa de cambio: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('settings').insert([
        { key: 'exchange_rate', value: exchangeRate, user_id: user.id, updated_at: new Date().toISOString() },
      ]);
      if (error) {
        console.error('Error inserting exchange rate:', error);
        setError('Error al crear la tasa de cambio: ' + error.message);
        return;
      }
    }

    const { error: historyError } = await supabase.from('exchange_rate_history').insert([
      { user_id: user.id, exchange_rate: parseFloat(exchangeRate) },
    ]);
    if (historyError) {
      console.error('Error saving to exchange rate history:', historyError);
    }

    await fetchExchangeRate(user);
    await fetchExchangeRateHistory(user);
    await fetchRateHistory(user);

    setSnackbarMessage('Tasa de cambio guardada');
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (error) {
    return (
      <Container>
        <Typography variant="h1" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Configuración
        </Typography>
        <Box sx={{ backgroundColor: '#ffebee', p: 3, borderRadius: '12px', mb: 2 }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
          sx={{ py: 1.5, px: 3 }}
        >
          Ir al Inicio de Sesión
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Navbar open={open} />
      <Container>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, color: '#1976d2' }}>
          Configuración
        </Typography>

        <Box sx={{ mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: '12px', boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
            Tasa de Cambio
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <TextField
                label="Tasa de cambio (Bs. por USD)"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                variant="outlined"
                size="small"
                type="number"
                sx={{ maxWidth: 200, backgroundColor: '#fff', borderRadius: '8px', '& .MuiInputBase-input': { fontSize: '1.5rem', fontWeight: 'bold' } }}
              />
            </Box>
            {previousExchangeRate && (
              <Box>
                <TextField
                  label="Tasa anterior (Bs. por USD)"
                  value={parseFloat(previousExchangeRate).toFixed(2)}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{ maxWidth: 200, backgroundColor: '#f0f0f0', borderRadius: '8px', '& .MuiInputBase-input': { fontSize: '1.5rem', fontWeight: 'bold', color: '#666' } }}
                />
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={saveExchangeRate}
              sx={{ py: 1.5, px: 3 }}
            >
              Guardar
            </Button>
          </Box>

          {lastUpdated && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                Última actualización:
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.5rem' }}>
                {lastUpdated}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 4, borderColor: '#e0e0e0' }} />

        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
          Historial de Tasas de Cambio (Últimas 5)
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Tasa de Cambio</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Fecha de Actualización</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rateHistory.length > 0 ? (
                rateHistory.map((rate, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontSize: '1rem' }}>Bs. {parseFloat(rate.exchange_rate).toFixed(2)} por USD</TableCell>
                    <TableCell sx={{ fontSize: '1rem' }}>
                      {rate.updated_at
                        ? new Date(rate.updated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'Sin fecha'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: 'center', fontSize: '1rem' }}>
                    No hay historial de tasas de cambio.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 4, borderColor: '#e0e0e0' }} />

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{ width: '100%', backgroundColor: '#4caf50', color: '#fff', borderRadius: '8px' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}

export default Settings;