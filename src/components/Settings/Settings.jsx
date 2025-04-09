// src/components/Settings/Settings.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Navbar from '../Navbar';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

function Settings() {
  const [exchangeRate, setExchangeRate] = useState('');

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setExchangeRate(data.value);
    }
  };

  const saveExchangeRate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'exchange_rate')
      .eq('user_id', user.id)
      .single();

    if (data) {
      // Actualizar la tasa existente
      await supabase
        .from('settings')
        .update({ value: exchangeRate })
        .eq('id', data.id);
    } else {
      // Crear una nueva tasa
      await supabase.from('settings').insert([
        { key: 'exchange_rate', value: exchangeRate, user_id: user.id },
      ]);
    }
    alert('Tasa de cambio guardada');
  };

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h1" gutterBottom>
          Configuración
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            label="Tasa de cambio (Bs. por USD)"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            variant="outlined"
            size="small"
            type="number"
          />
          <Button variant="contained" color="primary" onClick={saveExchangeRate}>
            Guardar
          </Button>
        </Box>
      </Container>
    </>
  );
}

export default Settings;