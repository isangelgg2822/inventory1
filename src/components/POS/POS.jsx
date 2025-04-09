// src/components/POS/POS.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import Navbar from '../Navbar';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CancelIcon from '@mui/icons-material/Cancel';
import { v4 as uuidv4 } from 'uuid'; // Para generar un sale_group_id único

function POS() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [cart, setCart] = useState([]);
  const [openTicket, setOpenTicket] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1); // Tasa de cambio por defecto
  const [salesGroups, setSalesGroups] = useState([]); // Grupos de ventas recientes
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
  const componentRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchExchangeRate();
    fetchSalesGroups();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error);
      alert(`Error al recuperar los productos: ${error.message} (Código: ${error.code})`);
      setProducts([]);
      return;
    }
    setProducts(data || []);
  };

  const fetchExchangeRate = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      alert('Error al obtener el usuario autenticado');
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
      alert(`Error al recuperar la tasa de cambio: ${error.message} (Código: ${error.code})`);
      return;
    }
    if (data) {
      setExchangeRate(parseFloat(data.value) || 1);
    }
  };

  const fetchSalesGroups = async () => {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      alert(`Error al recuperar las ventas: ${error.message} (Código: ${error.code})`);
      setSalesGroups([]);
      return;
    }

    if (!sales || sales.length === 0) {
      console.log('No sales found');
      setSalesGroups([]);
      return;
    }

    console.log('Sales retrieved:', sales);

    // Filtrar ventas no anuladas en el cliente
    const activeSales = sales.filter(sale => sale.is_canceled === false);

    if (activeSales.length === 0) {
      console.log('No active sales found (is_canceled = false)');
      setSalesGroups([]);
      return;
    }

    // Agrupar las ventas por sale_group_id
    const groupedSales = activeSales.reduce((acc, sale) => {
      const groupId = sale.sale_group_id;
      if (!groupId) {
        console.warn('Sale without sale_group_id:', sale);
        return acc; // Ignorar ventas sin sale_group_id
      }
      if (!acc[groupId]) {
        acc[groupId] = {
          sale_group_id: groupId,
          items: [],
          total: 0,
          date: sale.created_at,
        };
      }
      acc[groupId].items.push(sale);
      acc[groupId].total += sale.total;
      return acc;
    }, {});

    const groupedSalesArray = Object.values(groupedSales);
    console.log('Grouped sales:', groupedSalesArray);
    setSalesGroups(groupedSalesArray);
  };

  const addToCart = () => {
    if (!selectedProduct || !quantity) {
      alert('Por favor, selecciona un producto y una cantidad');
      return;
    }
    const quantityToAdd = parseInt(quantity);
    if (quantityToAdd > selectedProduct.quantity) {
      alert('No hay suficiente stock disponible');
      return;
    }
    const priceInBs = selectedProduct.price * exchangeRate; // Convertir el precio a bolívares
    const total = priceInBs * quantityToAdd;
    setCart([...cart, { ...selectedProduct, quantity: quantityToAdd, priceInBs, total }]);
    setSelectedProduct(null);
    setQuantity('');
  };

  const registerSale = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      alert('Error al obtener el usuario autenticado');
      return;
    }
    const userId = user.id;
    const saleGroupId = uuidv4(); // Generar un sale_group_id único para esta venta

    for (const item of cart) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.id)
        .single();

      if (productError || !product) {
        console.error('Error fetching product:', productError);
        alert(`Error al obtener el producto con ID ${item.id}: ${productError?.message || 'Producto no encontrado'}`);
        return;
      }

      const newQuantity = product.quantity - item.quantity;
      if (newQuantity < 0) {
        alert(`No hay suficiente stock para el producto ${item.name}`);
        return;
      }

      const { error: insertError } = await supabase.from('sales').insert([
        {
          product_id: item.id,
          quantity: item.quantity,
          total: item.total,
          user_id: userId,
          sale_group_id: saleGroupId,
          is_canceled: false,
        },
      ]);

      if (insertError) {
        console.error('Error inserting sale:', insertError);
        alert(`Error al registrar la venta: ${insertError.message} (Código: ${insertError.code})`);
        return;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (updateError) {
        console.error('Error updating product:', updateError);
        alert(`Error al actualizar el inventario: ${updateError.message} (Código: ${updateError.code})`);
        return;
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;
    setSaleDetails({
      items: cart,
      subtotal,
      tax,
      total,
      date: new Date().toLocaleString(),
      saleNumber: Math.floor(Math.random() * 10000),
      paymentMethod: 'CONTADO',
    });

    setOpenTicket(true);
    setCart([]);
    fetchProducts();
    fetchSalesGroups();
  };

  const cancelSaleGroup = async () => {
    if (!selectedSaleGroup) return;

    // Marcar todas las ventas del grupo como anuladas
    const { error: cancelError } = await supabase
      .from('sales')
      .update({ is_canceled: true })
      .eq('sale_group_id', selectedSaleGroup.sale_group_id);
    if (cancelError) {
      console.error('Error canceling sale group:', cancelError);
      alert(`Error al anular la venta: ${cancelError.message} (Código: ${cancelError.code})`);
      return;
    }

    // Devolver las cantidades al inventario
    for (const item of selectedSaleGroup.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        const newQuantity = product.quantity + item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', item.product_id);
        if (updateError) {
          console.error('Error updating product quantity:', updateError);
          alert(`Error al actualizar el inventario: ${updateError.message} (Código: ${updateError.code})`);
          return;
        }
      }
    }

    setOpenCancelDialog(false);
    setSelectedSaleGroup(null);
    fetchSalesGroups();
    fetchProducts();
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h1" gutterBottom>
          Punto de Venta
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Autocomplete
            options={products}
            getOptionLabel={(option) => option.name}
            value={selectedProduct}
            onChange={(event, newValue) => setSelectedProduct(newValue)}
            renderInput={(params) => <TextField {...params} label="Producto" variant="outlined" size="small" />}
            sx={{ width: 300 }}
          />
          <TextField
            label="Cantidad"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            variant="outlined"
            size="small"
            type="number"
          />
          <Button variant="contained" color="primary" onClick={addToCart}>
            Añadir al Carrito
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Precio Unitario (Bs.)</TableCell>
                <TableCell>Total (Bs.)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cart.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.priceInBs.toFixed(2)}</TableCell>
                  <TableCell>{item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {cart.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={registerSale} startIcon={<ReceiptIcon />}>
              Registrar Venta y Generar Ticket
            </Button>
          </Box>
        )}

        {/* Tabla de ventas recientes */}
        <Typography variant="h2" sx={{ mt: 4, mb: 2, fontSize: '1.8rem', fontWeight: 500 }}>
          Ventas Recientes
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Número de Venta</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total (Bs.)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center' }}>
                    No hay ventas recientes.
                  </TableCell>
                </TableRow>
              ) : (
                salesGroups.map((group, index) => (
                  <TableRow key={group.sale_group_id}>
                    <TableCell>Venta #{index + 1}</TableCell>
                    <TableCell>{new Date(group.date).toLocaleString()}</TableCell>
                    <TableCell>{group.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Tooltip title="Anular Venta">
                        <IconButton
                          color="secondary"
                          onClick={() => {
                            setSelectedSaleGroup(group);
                            setOpenCancelDialog(true);
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Modal para el ticket */}
      <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: '12px',
            maxWidth: 400,
            width: '100%',
          }}
        >
          <Box ref={componentRef} sx={{ p: 2, fontFamily: 'monospace', fontSize: '14px' }}>
            <Typography variant="h6" align="center">
              Mi Tienda
            </Typography>
            <Typography align="center" sx={{ fontSize: '12px' }}>
              Nota de Entrega #{saleDetails?.saleNumber}
            </Typography>
            <Typography align="center" sx={{ fontSize: '12px' }}>
              Fecha: {saleDetails?.date}
            </Typography>
            <Typography align="center" sx={{ fontSize: '12px', mb: 2 }}>
              {saleDetails?.paymentMethod}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography sx={{ fontSize: '12px', mb: 1 }}>
              Operador: {supabase.auth.getUser()?.email || 'Usuario'}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ mb: 2 }}>
              {saleDetails?.items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <Typography sx={{ flex: 1 }}>
                    {item.name} x {item.quantity}
                  </Typography>
                  <Typography>Bs. {item.total.toFixed(2)}</Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <Typography>SUBTOTAL Bs.</Typography>
              <Typography>Bs. {saleDetails?.subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <Typography>IVA 16% Bs.</Typography>
              <Typography>Bs. {saleDetails?.tax.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
              <Typography>TOTAL Bs.</Typography>
              <Typography>Bs. {saleDetails?.total.toFixed(2)}</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" color="primary" onClick={handlePrint}>
              Imprimir Ticket
            </Button>
            <Button variant="outlined" onClick={() => setOpenTicket(false)}>
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Diálogo de confirmación para anular venta */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>Confirmar Anulación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas anular esta venta? Esto devolverá las cantidades al inventario.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={cancelSaleGroup} color="secondary">
            Anular Venta
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default POS;