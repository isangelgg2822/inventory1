// src/components/POS/POS.jsx
import { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  useMediaQuery,
  useTheme,
  Grid, // Importamos Grid desde @mui/material
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import { v4 as uuidv4 } from 'uuid';
import { useDashboard } from '../../context/DashboardHooks';

// Componente memoizado para las filas de la tabla
const CartRow = memo(({ item, index }) => (
  <TableRow key={index}>
    <TableCell>{item.name}</TableCell>
    <TableCell>{item.quantity}</TableCell>
    <TableCell>{item.priceWithIvaBs.toFixed(2)}</TableCell>
    <TableCell>{item.totalBs.toFixed(2)}</TableCell>
  </TableRow>
));

// Componente memoizado para las filas de ventas recientes
const SaleRow = memo(({ group, index, reprintTicket, setSelectedSaleGroup, setOpenCancelDialog }) => (
  <TableRow key={group.sale_group_id}>
    <TableCell>Venta #{index + 1}</TableCell>
    <TableCell>{new Date(group.date).toLocaleString()}</TableCell>
    <TableCell>{group.total.toFixed(2)}</TableCell>
    <TableCell>
      <Tooltip title="Reimprimir Ticket">
        <IconButton color="primary" onClick={() => reprintTicket(group)}>
          <PrintIcon />
        </IconButton>
      </Tooltip>
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
));

function POS() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [cart, setCart] = useState([]);
  const [openTicket, setOpenTicket] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [salesGroups, setSalesGroups] = useState([]);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
  const componentRef = useRef();

  const { fetchDailySales, fetchTotalProducts } = useDashboard();

  const IVA_RATE = 0.16;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').limit(50);
    if (error) {
      console.error('Error fetching products:', error);
      alert(`Error al recuperar los productos: ${error.message} (Código: ${error.code})`);
      setProducts([]);
      return;
    }
    setProducts(data || []);
  }, []);

  const fetchExchangeRate = useCallback(async () => {
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
  }, []);

  const handleSalesData = useCallback((sales) => {
    if (!sales || sales.length === 0) {
      setSalesGroups([]);
      return;
    }

    const activeSales = sales.filter(sale => sale.is_canceled === false);

    if (activeSales.length === 0) {
      setSalesGroups([]);
      return;
    }

    const groupedSales = activeSales.reduce((acc, sale) => {
      const groupId = sale.sale_group_id;
      if (!groupId) {
        console.warn('Sale without sale_group_id:', sale);
        return acc;
      }
      if (!acc[groupId]) {
        acc[groupId] = {
          sale_group_id: groupId,
          items: [],
          total: 0,
          date: sale.created_at || new Date(sale.id).toISOString(),
        };
      }
      acc[groupId].items.push(sale);
      acc[groupId].total += sale.total;
      return acc;
    }, {});

    const groupedSalesArray = Object.values(groupedSales);
    setSalesGroups(groupedSalesArray);
  }, []);

  const fetchSalesGroups = useCallback(async () => {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === '42703') {
        console.warn('created_at column does not exist, falling back to ordering by id');
        const { data: fallbackSales, error: fallbackError } = await supabase
          .from('sales')
          .select('*')
          .order('id', { ascending: false })
          .limit(20);

        if (fallbackError) {
          console.error('Error fetching sales (fallback):', fallbackError);
          alert(`Error al recuperar las ventas (fallback): ${fallbackError.message} (Código: ${fallbackError.code})`);
          setSalesGroups([]);
          return;
        }

        handleSalesData(fallbackSales);
        return;
      }

      console.error('Error fetching sales:', error);
      alert(`Error al recuperar las ventas: ${error.message} (Código: ${error.code})`);
      setSalesGroups([]);
      return;
    }

    handleSalesData(sales);
  }, [handleSalesData]);

  useEffect(() => {
    fetchProducts();
    fetchExchangeRate();
    fetchSalesGroups();
  }, [fetchProducts, fetchExchangeRate, fetchSalesGroups]);

  const addToCart = useCallback(() => {
    if (!selectedProduct || !quantity) {
      alert('Por favor, selecciona un producto y una cantidad');
      return;
    }
    const quantityToAdd = parseInt(quantity);
    if (quantityToAdd > selectedProduct.quantity) {
      alert('No hay suficiente stock disponible');
      return;
    }

    const priceWithIvaUsd = selectedProduct.price;
    const priceWithoutIvaUsd = priceWithIvaUsd / (1 + IVA_RATE);
    const ivaUsd = priceWithIvaUsd - priceWithoutIvaUsd;

    const priceWithoutIvaBs = priceWithoutIvaUsd * exchangeRate;
    const ivaBs = ivaUsd * exchangeRate;
    const priceWithIvaBs = priceWithIvaUsd * exchangeRate;

    const subtotalBs = priceWithoutIvaBs * quantityToAdd;
    const ivaTotalBs = ivaBs * quantityToAdd;
    const totalBs = priceWithIvaBs * quantityToAdd;

    setCart([
      ...cart,
      {
        ...selectedProduct,
        quantity: quantityToAdd,
        priceWithoutIvaBs,
        ivaBs,
        priceWithIvaBs,
        subtotalBs,
        ivaTotalBs,
        totalBs,
      },
    ]);
    setSelectedProduct(null);
    setQuantity('');
  }, [selectedProduct, quantity, exchangeRate, cart]);

  const registerSale = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      alert('Error al obtener el usuario autenticado');
      return;
    }
    const userId = user.id;
    const saleGroupId = uuidv4();

    try {
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
            total: item.totalBs,
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

      const subtotalBs = cart.reduce((sum, item) => sum + item.subtotalBs, 0);
      const taxBs = cart.reduce((sum, item) => sum + item.ivaTotalBs, 0);
      const totalBs = cart.reduce((sum, item) => sum + item.totalBs, 0);

      const saleNumber = Math.floor(Math.random() * 10000);
      const paymentMethod = 'CONTADO';

      if (!saleGroupId || typeof saleGroupId !== 'string') {
        console.error('Invalid sale_group_id:', saleGroupId);
        alert('Error: sale_group_id no es válido');
        return;
      }
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid user_id:', userId);
        alert('Error: user_id no es válido');
        return;
      }
      if (typeof subtotalBs !== 'number' || isNaN(subtotalBs)) {
        console.error('Invalid subtotal:', subtotalBs);
        alert('Error: subtotal no es un número válido');
        return;
      }
      if (typeof taxBs !== 'number' || isNaN(taxBs)) {
        console.error('Invalid tax:', taxBs);
        alert('Error: tax no es un número válido');
        return;
      }
      if (typeof totalBs !== 'number' || isNaN(totalBs)) {
        console.error('Invalid total:', totalBs);
        alert('Error: total no es un número válido');
        return;
      }
      if (!Number.isInteger(saleNumber)) {
        console.error('Invalid sale_number:', saleNumber);
        alert('Error: sale_number no es un entero válido');
        return;
      }
      if (!paymentMethod || typeof paymentMethod !== 'string') {
        console.error('Invalid payment_method:', paymentMethod);
        alert('Error: payment_method no es válido');
        return;
      }

      const saleGroupData = {
        sale_group_id: saleGroupId,
        user_id: userId,
        subtotal: subtotalBs,
        tax: taxBs,
        total: totalBs,
        sale_number: saleNumber,
        payment_method: paymentMethod,
      };

      const { error: insertGroupError } = await supabase.from('sale_groups').insert([saleGroupData]);

      if (insertGroupError) {
        console.error('Error inserting sale group:', insertGroupError);
        const errorMessage = insertGroupError.message || 'Error desconocido al insertar en sale_groups';
        const errorCode = insertGroupError.code || 'Desconocido';
        alert(`Error al registrar los detalles de la venta: ${errorMessage} (Código: ${errorCode})`);
        return;
      }

      setSaleDetails({
        items: cart,
        subtotal: subtotalBs,
        tax: taxBs,
        total: totalBs,
        date: new Date().toLocaleString(),
        saleNumber,
        paymentMethod,
      });

      setOpenTicket(true);
      setCart([]);
      fetchProducts();
      fetchSalesGroups();
      fetchDailySales();
      fetchTotalProducts();
    } catch (error) {
      console.error('Unexpected error in registerSale:', error);
      alert(`Error inesperado al registrar la venta: ${error.message || 'Error desconocido'}`);
    }
  }, [cart, fetchProducts, fetchSalesGroups, fetchDailySales, fetchTotalProducts]);

  const reprintTicket = useCallback(async (saleGroup) => {
    const { data: saleGroupDetails, error } = await supabase
      .from('sale_groups')
      .select('*')
      .eq('sale_group_id', saleGroup.sale_group_id)
      .single();

    if (error || !saleGroupDetails) {
      console.error('Error fetching sale group details:', error);
      alert(`Error al recuperar los detalles de la venta: ${error?.message || 'Detalles no encontrados'}`);
      return;
    }

    setSaleDetails({
      items: saleGroup.items,
      subtotal: saleGroupDetails.subtotal,
      tax: saleGroupDetails.tax,
      total: saleGroupDetails.total,
      date: new Date(saleGroup.date).toLocaleString(),
      saleNumber: saleGroupDetails.sale_number,
      paymentMethod: saleGroupDetails.payment_method,
    });

    setOpenTicket(true);
  }, []);

  const cancelSaleGroup = useCallback(async () => {
    if (!selectedSaleGroup) return;

    const { error: cancelError } = await supabase
      .from('sales')
      .update({ is_canceled: true })
      .eq('sale_group_id', selectedSaleGroup.sale_group_id);
    if (cancelError) {
      console.error('Error canceling sale group:', cancelError);
      alert(`Error al anular la venta: ${cancelError.message} (Código: ${cancelError.code})`);
      return;
    }

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
    fetchDailySales();
    fetchTotalProducts();
  }, [selectedSaleGroup, products, fetchSalesGroups, fetchProducts, fetchDailySales, fetchTotalProducts]);

  const handlePrint = useCallback(() => {
    console.log('Printing ticket using window.print...');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes para este sitio.');
      return;
    }

    const content = `
      <html>
        <head>
          <title>Ticket de Venta</title>
          <style>
            body {
              font-family: monospace;
              font-size: ${isMobile ? '8px' : '10px'};
              line-height: 1.2;
              width: 80mm;
              margin: 0 auto;
              text-align: center;
              padding: ${isMobile ? '2mm' : '5mm'};
              box-sizing: border-box;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              text-align: left;
              margin-bottom: 2px;
            }
            .total {
              font-size: ${isMobile ? '10px' : '12px'};
              font-weight: bold;
            }
            @media print and (max-width: 58mm) {
              body {
                font-size: 8px;
                width: 58mm;
                padding: 2mm;
              }
              .total {
                font-size: 10px;
              }
            }
            @media print and (min-width: 80mm) {
              body {
                font-size: 12px;
                width: 80mm;
                padding: 10mm;
              }
              .total {
                font-size: 14px;
              }
            }
            @media print {
              body {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.close()">
          <h1 style="font-size: ${isMobile ? '10px' : '12px'}; font-weight: bold; margin: 0;">Mi Tienda</h1>
          <p style="margin: 2px 0;">Nota de Entrega #${saleDetails?.saleNumber}</p>
          <p style="margin: 2px 0;">Fecha: ${saleDetails?.date}</p>
          <p style="margin: 2px 0 5px;">${saleDetails?.paymentMethod}</p>
          <div class="divider"></div>
          <p style="text-align: left; margin: 5px 0;">Operador: ${
            supabase.auth.getUser()?.email || 'Usuario'
          }</p>
          <div class="divider"></div>
          <div style="text-align: left; margin-bottom: 5px;">
            ${saleDetails?.items
              .map(
                (item) =>
                  `<div class="item">
                    <span style="flex: 1;">${item.name} x ${item.quantity}</span>
                    <span>Bs. ${item.totalBs.toFixed(2)}</span>
                  </div>`
              )
              .join('')}
          </div>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span>SUBTOTAL Bs.</span>
            <span>Bs. ${saleDetails?.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span>IVA 16% Bs.</span>
            <span>Bs. ${saleDetails?.tax.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;" class="total">
            <span>TOTAL Bs.</span>
            <span>Bs. ${saleDetails?.total.toFixed(2)}</span>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
  }, [saleDetails, isMobile]);

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
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
          >
            Punto de Venta
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 4,
            }}
          >
            <Autocomplete
              options={products}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(event, newValue) => setSelectedProduct(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Producto" variant="outlined" size="small" />
              )}
              sx={{ width: { xs: '100%', sm: 300 } }}
            />
            <TextField
              label="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              variant="outlined"
              size="small"
              type="number"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={addToCart}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Añadir al Carrito
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size={isMobile ? 'small' : 'medium'}>
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
                  <CartRow key={index} item={item} index={index} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {cart.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={registerSale}
                startIcon={<ReceiptIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Registrar Venta y Generar Ticket
              </Button>
            </Box>
          )}

          <Typography
            variant="h2"
            sx={{
              mt: 4,
              mb: 2,
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
              fontWeight: 500,
            }}
          >
            Ventas Recientes
          </Typography>
          <TableContainer component={Paper}>
            <Table size={isMobile ? 'small' : 'medium'}>
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
                    <SaleRow
                      key={group.sale_group_id}
                      group={group}
                      index={index}
                      reprintTicket={reprintTicket}
                      setSelectedSaleGroup={setSelectedSaleGroup}
                      setOpenCancelDialog={setOpenCancelDialog}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
            borderRadius: '8px',
            maxWidth: { xs: '90vw', sm: '80mm' },
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <Box
            ref={componentRef}
            sx={{
              p: 1,
              fontFamily: 'monospace',
              fontSize: { xs: '8px', sm: '10px' },
              lineHeight: 1.2,
              width: '80mm',
              textAlign: 'center',
              mx: 'auto',
            }}
          >
            <Typography variant="h6" sx={{ fontSize: { xs: '10px', sm: '12px' }, fontWeight: 'bold' }}>
              Mi Tienda
            </Typography>
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px' } }}>
              Nota de Entrega #{saleDetails?.saleNumber}
            </Typography>
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px' } }}>
              Fecha: {saleDetails?.date}
            </Typography>
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px' }, mb: 1 }}>
              {saleDetails?.paymentMethod}
            </Typography>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px' }, mb: 1, textAlign: 'left' }}>
              Operador: {supabase.auth.getUser()?.email || 'Usuario'}
            </Typography>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
            <Box sx={{ mb: 1, textAlign: 'left' }}>
              {saleDetails?.items.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: { xs: '8px', sm: '10px' },
                  }}
                >
                  <Typography sx={{ flex: 1 }}>
                    {item.name} x {item.quantity}
                  </Typography>
                  <Typography>Bs. {item.totalBs.toFixed(2)}</Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: { xs: '8px', sm: '10px' } }}>
              <Typography>SUBTOTAL Bs.</Typography>
              <Typography>Bs. {saleDetails?.subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: { xs: '8px', sm: '10px' } }}>
              <Typography>IVA 16% Bs.</Typography>
              <Typography>Bs. {saleDetails?.tax.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: { xs: '10px', sm: '12px' },
                fontWeight: 'bold',
              }}
            >
              <Typography>TOTAL Bs.</Typography>
              <Typography>Bs. {saleDetails?.total.toFixed(2)}</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary" onClick={handlePrint}>
              Imprimir Ticket
            </Button>
            <Button variant="outlined" onClick={() => setOpenTicket(false)}>
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>

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