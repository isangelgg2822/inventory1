import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { supabase } from '../../supabase';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Drawer from '@mui/material/Drawer';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { v4 as uuidv4 } from 'uuid';
import { useDashboard } from '../../context/DashboardHooks';
import { useDrawer } from '../../context/DrawerHooks';
import { useNavigate } from 'react-router-dom';

// Componente memoizado para las filas de ventas recientes
const SaleRow = memo(({ group, index, products, reprintTicket, setSelectedSaleGroup, setOpenCancelDialog }) => {
  const productNames = group.items.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return product ? `${product.name} (x${item.quantity})` : `ID: ${item.product_id} (x${item.quantity})`;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <TableRow key={group.sale_group_id}>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
        Venta #{index + 1}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
        {formatDate(group.date)}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
        {productNames.join(', ')}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
        {group.total.toFixed(2)}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
        {group.user_name || 'Desconocido'}
      </TableCell>
      <TableCell sx={{ py: { xs: 0.2, sm: 0.4 } }}>
        <Tooltip title="Reimprimir Ticket">
          <IconButton color="primary" onClick={() => reprintTicket(group)}>
            <PrintIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
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
            <CancelIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

function PointOfSale() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [cart, setCart] = useState([]);
  const [openTicket, setOpenTicket] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [salesGroups, setSalesGroups] = useState([]);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState(null);
  const [cashierName, setCashierName] = useState('Usuario');
  const componentRef = useRef();
  const navigate = useNavigate();

  const { fetchDailySales, fetchTotalProducts } = useDashboard();
  const { open, isMobile } = useDrawer();

  const IVA_RATE = 0.16;

  const paymentOptions = [
    'Efectivo Bs',
    'Divisa',
    'Débito',
    'Biopago',
    'Pago Móvil',
    'Avance de Efectivo',
  ];

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').limit(50);
    if (error) {
      console.error('Error fetching products:', error);
      setError(`Error al recuperar los productos: ${error.message} (Código: ${error.code})`);
      setProducts([]);
      return;
    }
    setProducts(data || []);
  }, [setError, setProducts]);

  useEffect(() => {
    const fetchCashierName = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error getting user:', authError);
        setCashierName('Usuario');
        return;
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        console.error('Error fetching user data:', userDataError);
        setCashierName('Usuario');
        return;
      }

      setCashierName(userData.first_name || 'Usuario');
    };
    fetchCashierName();
  }, []);

  const fetchExchangeRate = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      setError('No se pudo autenticar el usuario. Por favor, inicia sesión nuevamente.');
      navigate('/login');
      return;
    }
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .eq('user_id', user.id);
    if (error) {
      console.error('Error fetching exchange rate:', error);
      setError(`Error al recuperar la tasa de cambio: ${error.message} (Código: ${error.code})`);
      return;
    }
    if (data && data.length > 0) {
      if (data.length > 1) {
        console.warn('Multiple exchange rates found for user:', user.id);
        setError('Se encontraron múltiples tasas de cambio. Por favor, corrige esto en la configuración.');
        return;
      }
      setExchangeRate(parseFloat(data[0].value) || 1);
    } else {
      setError('No se encontró una tasa de cambio. Por favor, configúrala en la sección de Configuración.');
      setExchangeRate(null);
    }
  }, [navigate, setError, setExchangeRate]);

  const handleSalesData = useCallback((sales, userMap) => {
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
          user_id: sale.user_id,
          user_name: userMap[sale.user_id] || 'Desconocido', // Nombre del usuario
        };
      }
      acc[groupId].items.push(sale);
      acc[groupId].total += sale.total;
      return acc;
    }, {});

    const groupedSalesArray = Object.values(groupedSales);
    setSalesGroups(groupedSalesArray);
  }, [setSalesGroups]);

  const fetchSalesGroups = useCallback(async () => {
    // Primero, obtener los usuarios para mapear user_id a first_name
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      setError(`Error al recuperar los usuarios: ${usersError.message} (Código: ${usersError.code})`);
      setSalesGroups([]);
      return;
    }

    // Crear un mapa de user_id a first_name
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user.first_name || 'Desconocido';
      return acc;
    }, {});

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
          setError(`Error al recuperar las ventas (fallback): ${fallbackError.message} (Código: ${fallbackError.code})`);
          setSalesGroups([]);
          return;
        }

        handleSalesData(fallbackSales, userMap);
        return;
      }

      console.error('Error fetching sales:', error);
      setError(`Error al recuperar las ventas: ${error.message} (Código: ${error.code})`);
      setSalesGroups([]);
      return;
    }

    handleSalesData(sales, userMap);
  }, [handleSalesData, setError, setSalesGroups]);

  useEffect(() => {
    fetchProducts();
    fetchExchangeRate();
    fetchSalesGroups();
  }, [fetchProducts, fetchExchangeRate, fetchSalesGroups]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProducts([]);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setFilteredProducts([]);
  };

  const addToCart = useCallback(() => {
    if (!exchangeRate) {
      setError('No se puede añadir al carrito porque la tasa de cambio no está configurada.');
      return;
    }
    if (!selectedProduct || !quantity) {
      setError('Por favor, selecciona un producto y una cantidad');
      return;
    }
    const quantityToAdd = parseInt(quantity);
    if (quantityToAdd <= 0) {
      setError('La cantidad debe ser mayor que 0');
      return;
    }
    if (quantityToAdd > selectedProduct.quantity) {
      setError('No hay suficiente stock disponible');
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
    setSearchQuery('');
    setFilteredProducts([]);
    setQuantity('');
    setError(null);
  }, [selectedProduct, quantity, exchangeRate, cart, setCart, setSelectedProduct, setSearchQuery, setFilteredProducts, setQuantity, setError]);

  const removeFromCart = useCallback((index) => {
    setCart(cart.filter((_, i) => i !== index));
  }, [cart, setCart]);

  const registerSale = useCallback(async () => {
    if (!paymentMethod) {
      setError('Por favor, selecciona un método de pago');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      setError('No se pudo autenticar el usuario. Por favor, inicia sesión nuevamente.');
      navigate('/login');
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
          setError(`Error al obtener el producto con ID ${item.id}: ${productError?.message || 'Producto no encontrado'}`);
          return;
        }

        const newQuantity = product.quantity - item.quantity;
        if (newQuantity < 0) {
          setError(`No hay suficiente stock para el producto ${item.name}`);
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
          setError(`Error al registrar la venta: ${insertError.message} (Código: ${insertError.code})`);
          return;
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', item.id);

        if (updateError) {
          console.error('Error updating product:', updateError);
          setError(`Error al actualizar el inventario: ${updateError.message} (Código: ${updateError.code})`);
          return;
        }
      }

      const subtotalBs = cart.reduce((sum, item) => sum + item.subtotalBs, 0);
      const taxBs = cart.reduce((sum, item) => sum + item.ivaTotalBs, 0);
      const totalBs = cart.reduce((sum, item) => sum + item.totalBs, 0);

      const saleNumber = Math.floor(Math.random() * 10000);

      if (!saleGroupId || typeof saleGroupId !== 'string') {
        console.error('Invalid sale_group_id:', saleGroupId);
        setError('Error: sale_group_id no es válido');
        return;
      }
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid user_id:', userId);
        setError('Error: user_id no es válido');
        return;
      }
      if (typeof subtotalBs !== 'number' || isNaN(subtotalBs)) {
        console.error('Invalid subtotal:', subtotalBs);
        setError('Error: subtotal no es un número válido');
        return;
      }
      if (typeof taxBs !== 'number' || isNaN(taxBs)) {
        console.error('Invalid tax:', taxBs);
        setError('Error: tax no es un número válido');
        return;
      }
      if (typeof totalBs !== 'number' || isNaN(totalBs)) {
        console.error('Invalid total:', totalBs);
        setError('Error: total no es un número válido');
        return;
      }
      if (!Number.isInteger(saleNumber)) {
        console.error('Invalid sale_number:', saleNumber);
        setError('Error: sale_number no es un entero válido');
        return;
      }
      if (!paymentMethod || typeof paymentMethod !== 'string') {
        console.error('Invalid payment_method:', paymentMethod);
        setError('Error: payment_method no es válido');
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
        setError(`Error al registrar los detalles de la venta: ${errorMessage} (Código: ${errorCode})`);
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
      setPaymentMethod('');
      fetchProducts();
      fetchSalesGroups();
      fetchDailySales();
      fetchTotalProducts();
      if (isMobile) {
        setCartDrawerOpen(false);
      }
      setError(null);
    } catch (error) {
      console.error('Unexpected error in registerSale:', error);
      setError(`Error inesperado al registrar la venta: ${error.message || 'Error desconocido'}`);
    }
  }, [cart, fetchProducts, fetchSalesGroups, fetchDailySales, fetchTotalProducts, isMobile, paymentMethod, navigate, setCart, setPaymentMethod, setSaleDetails, setOpenTicket, setCartDrawerOpen, setError]);

  const reprintTicket = useCallback(async (saleGroup) => {
    const { data: saleGroupDetails, error } = await supabase
      .from('sale_groups')
      .select('*')
      .eq('sale_group_id', saleGroup.sale_group_id)
      .single();

    if (error || !saleGroupDetails) {
      console.error('Error fetching sale group details:', error);
      setError(`Error al recuperar los detalles de la venta: ${error?.message || 'Detalles no encontrados'}`);
      return;
    }

    const transformedItems = saleGroup.items.map(item => ({
      ...item,
      name: products.find(p => p.id === item.product_id)?.name || `ID: ${item.product_id}`,
      totalBs: item.total,
    }));

    const subtotal = saleGroupDetails.subtotal ?? saleGroup.items.reduce((sum, item) => sum + (item.total || 0), 0);

    setSaleDetails({
      items: transformedItems,
      subtotal: subtotal,
      tax: saleGroupDetails.tax ?? 0,
      total: saleGroupDetails.total ?? 0,
      date: new Date(saleGroup.date).toLocaleString(),
      saleNumber: saleGroupDetails.sale_number,
      paymentMethod: saleGroupDetails.payment_method,
    });

    setOpenTicket(true);
  }, [products, setError, setSaleDetails]);

  const cancelSaleGroup = useCallback(async () => {
    if (!selectedSaleGroup) return;

    const { error: cancelError } = await supabase
      .from('sales')
      .update({ is_canceled: true })
      .eq('sale_group_id', selectedSaleGroup.sale_group_id);
    if (cancelError) {
      console.error('Error canceling sale group:', cancelError);
      setError(`Error al anular la venta: ${cancelError.message} (Código: ${cancelError.code})`);
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
          setError(`Error al actualizar el inventario: ${updateError.message} (Código: ${updateError.code})`);
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
    setError(null);
  }, [selectedSaleGroup, products, fetchSalesGroups, fetchProducts, fetchDailySales, fetchTotalProducts, setOpenCancelDialog, setSelectedSaleGroup, setError]);

  const handlePrint = useCallback(() => {
    console.log('Printing ticket using window.print...');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes para este sitio.');
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
          <h1 style="font-size: ${isMobile ? '10px' : '12px'}; font-weight: bold; margin: 0;">Dxtodito C.A</h1>
          <p style="margin: 2px 0;">Nota de Entrega #${saleDetails?.saleNumber ?? 'N/A'}</p>
          <p style="margin: 2px 0;">Fecha: ${saleDetails?.date ?? 'N/A'}</p>
          <p style="margin: 2px 0 5px;">Método de Pago: ${saleDetails?.paymentMethod ?? 'N/A'}</p>
          <div class="divider"></div>
          <p style="text-align: left; margin: 5px 0;">Cajero: ${cashierName}</p>
          <div class="divider"></div>
          <div style="text-align: left; margin-bottom: 5px;">
            ${saleDetails?.items
              ?.map(
                (item) =>
                  `<div class="item">
                    <span style="flex: 1;">${item.name} x ${item.quantity}</span>
                    <span>Bs. ${(item.totalBs ?? 0).toFixed(2)}</span>
                  </div>`
              )
              .join('') ?? ''}
          </div>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span>SUBTOTAL Bs.</span>
            <span>Bs. ${(saleDetails?.subtotal ?? 0).toFixed(2)}</span>
          </div>
          //  <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            //  <span>IVA (16%)</span>
            // <span>Bs. ${(saleDetails?.tax ?? 0).toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;" class="total">
            <span>TOTAL Bs.</span>
            <span>Bs. ${(saleDetails?.total ?? 0).toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <p style="margin: 5px 0;">Gracias por su compra</p>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
  }, [saleDetails, isMobile, cashierName, setError]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotalBs, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.totalBs, 0);

  if (error) {
    return (
      <Container sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h1"
          gutterBottom
          sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' }, fontWeight: 600 }}
        >
          Punto de Venta
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

  const cartContent = (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#f5f5f5', height: '100%' }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          color: '#1976d2',
          textAlign: 'center',
          fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem', lg: '1.8rem' },
        }}
      >
        Carrito De Compras
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2, md: 3 },
          mb: 3,
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Box sx={{ flex: 1, position: 'relative' }}>
          <TextField
            label="Buscar Producto"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            variant="outlined"
            size="medium"
            fullWidth
            sx={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, padding: { xs: '8px', sm: '10px' } }, py: { md: 0.8 },
            }}
          />
          {filteredProducts.length > 0 && (
            <List
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                bgcolor: 'background.paper',
                boxShadow: 3,
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                borderRadius: '8px',
              }}
            >
              {filteredProducts.map((product) => (
                <ListItem
                  key={product.id}
                  button
                  onClick={() => selectProduct(product)}
                  sx={{ '&:hover': { backgroundColor: '#e3f2fd' }, py: { xs: 0.5, sm: 1 } }}
                >
                  <ListItemText primary={product.name} primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <TextField
          label="Cantidad"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          variant="outlined"
          size="small"
          type="number"
          sx={{
            width: { xs: '100%', sm: '80px', md: '100px' },
            backgroundColor: '#fff',
            borderRadius: '8px',
            '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={addToCart}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            whiteSpace: 'nowrap',
            py: { xs: 1, sm: 1.2, md: 1.5 },
            px: { xs: 2, sm: 3 },
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' },
          }}
        >
          Añadir al Carrito
        </Button>
      </Box>

      {cart.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
          El carrito está vacío
        </Typography>
      ) : (
        <Box sx={{ fontFamily: 'monospace', fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' }, lineHeight: 1.4 }}>
          <Typography sx={{ fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '18px' }, fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
            Dxtodito C.A
          </Typography>
          <Typography sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' }, textAlign: 'center', mb: 1 }}>
            Cajero: {cashierName}
          </Typography>
          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#666' }} />
          <Box sx={{ mb: 2, textAlign: 'left' }}>
            {cart.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                  py: { xs: 0.5, sm: 0.5, md: 1 },
                  '&:hover': { backgroundColor: '#e3f2fd' },
                }}
              >
                <Typography sx={{ flex: 1, fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' } }}>
                  {item.name} x {item.quantity}
                </Typography>
                <Typography sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' }, mr: 1 }}>
                  Bs. {item.totalBs.toFixed(2)}
                </Typography>
                <Tooltip title="Eliminar del Carrito">
                  <IconButton color="error" onClick={() => removeFromCart(index)} size="small">
                    <DeleteIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#666' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' }, mb: 0.5 }}>
            <Typography>SUBTOTAL Bs.</Typography>
            <Typography>Bs. {cartSubtotal.toFixed(2)}</Typography>
          </Box>
          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#666' }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '18px' },
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            <Typography>TOTAL Bs.</Typography>
            <Typography>Bs. {cartTotal.toFixed(2)}</Typography>
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="payment-method-label">Método de Pago</InputLabel>
            <Select
              labelId="payment-method-label"
              value={paymentMethod}
              label="Método de Pago"
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}
            >
              {paymentOptions.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={registerSale}
            startIcon={<ReceiptIcon />}
            sx={{
              width: '100%',
              py: { xs: 1, sm: 1.2, md: 1.5 },
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' },
            }}
            disabled={cart.length === 0 || !paymentMethod}
          >
            Registrar Venta y Generar Ticket
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3, lg: 4 },
          ml: { sm: open ? '240px' : 0, lg: open ? '280px' : 0 },
          mr: { sm: '300px', md: '400px', lg: '450px', xl: '500px' },
          mt: { xs: 8, sm: 8, md: 10 }, 
          mb: { xs: 4, sm: 6 },
          width: {
            xs: '100%',
            sm: open ? 'calc(100% - 240px - 300px)' : 'calc(100% - 300px)',
            md: open ? 'calc(100% - 240px - 400px)' : 'calc(100% - 400px)',
            lg: open ? 'calc(100% - 280px - 450px)' : 'calc(100% - 450px)',
            xl: open ? 'calc(100% - 280px - 500px)' : 'calc(100% - 500px)',
          },
          maxWidth: { xl: '1920px' },
          mx: { xl: 'auto' },
          transition: 'margin-left 0.3s, margin-right 0.3s, width 0.3s',
        }}
      >
        <Container sx={{ px: { xs: 0, sm: 1, md: 2, lg: 3 }, maxWidth: '100%' }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem', lg: '2.5rem' },
              fontWeight: 600,
              color: '#1976d2',
            }}
          >
            Punto de Venta
          </Typography>
          <Divider sx={{ mb: { xs: 2, sm: 3, md: 6},borderColor: '#e0e0e0' }} />
          {isMobile && (
            <Button
              variant="contained"
              onClick={() => setCartDrawerOpen(true)}
              startIcon={<ShoppingCartIcon />}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                whiteSpace: 'nowrap',
                mb: { xs: 2, sm: 3, md: 4 },
                py: { xs: 0.8, sm: 1 },
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                
              }}
              
            >
              Ver Carrito ({cart.length})
            </Button>
          )}

          <Typography
            variant="h2"
            sx={{
              mt: { xs: 2, sm: 3, md: 4 },
              mb: { xs: 0.5, sm: 1 }, // Reducido el margen inferior
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem', lg: '2rem' },
              fontWeight: 500,
              color: '#1976d2',
            }}
          >
            Ventas Recientes
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', mt: 0 }}>
            <Table size={isMobile ? 'small' : 'medium'} sx={{ '& .MuiTableCell-root': { padding: '2px 16px' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                    Número de Venta
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                    Fecha
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                    Productos
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                    Total (Bs.)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                    Cajero
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 0.2, sm: 0.4 } }}>
                      No hay ventas recientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesGroups.map((group, index) => (
                    <SaleRow
                      key={group.sale_group_id}
                      group={group}
                      index={index}
                      products={products}
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

      <Box
        sx={{
          width: { sm: '300px', md: '400px', lg: '450px', xl: '500px' },
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
          height: 'calc(100vh - 48px)',
          overflowY: 'auto',
          position: 'fixed',
          right: 0,
          top: 0,
          mt: { xs: 8, sm: 8, md: 10 },
          zIndex: 1000,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {cartContent}
      </Box>

      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: 'min(300px, 90%)', sm: '300px', md: '400px' },
            bgcolor: 'background.paper',
            height: 'calc(100% - 48px)',
            top: { xs: 64, sm: 64, md: 80 },
          },
          display: { xs: 'block', sm: 'none' },
        }}
      >
        {cartContent}
      </Drawer>

      <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: { xs: 2, sm: 3 },
            borderRadius: '12px',
            maxWidth: { xs: '90vw', sm: '100mm' },
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Box
            ref={componentRef}
            sx={{
              p: 1,
              fontFamily: 'monospace',
              fontSize: { saputo: '8px', sm: '10px', md: '12px' },
              lineHeight: 1.2,
              width: '100mm',
              textAlign: 'center',
              mx: 'auto',
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px' }, fontWeight: 'bold', color: '#1976d2' }}
            >
              Dxtodito C.A
            </Typography>
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px', md: '12px' } }}>
              Nota de Entrega #{saleDetails?.saleNumber ?? 'N/A'}
            </Typography>
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px', md: '12px' } }}>
              Fecha: {saleDetails?.date ?? 'N/A'}
            </Typography>
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px', md: '12px' }, mb: 1 }}>
              Método de Pago: {saleDetails?.paymentMethod ?? 'N/A'}
            </Typography>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5, borderColor: '#666' }} />
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px', md: '12px' }, mb: 1, textAlign: 'left' }}>
              Cajero: {cashierName}
            </Typography>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5, borderColor: '#666' }} />
            <Box sx={{ mb: 1, textAlign: 'left' }}>
              {saleDetails?.items?.map((item, index) => (
                <Box
                  key={`${item.id}-${index}`}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: { xs: '8px', sm: '10px', md: '12px' },
                  }}
                >
                  <Typography sx={{ flex: 1 }}>
                    {item.name} x {item.quantity}
                  </Typography>
                  <Typography>Bs. {(item.totalBs ?? 0).toFixed(2)}</Typography>
                </Box>
              )) ?? null}
            </Box>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5, borderColor: '#666' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: { xs: '8px', sm: '10px', md: '12px' } }}>
              <Typography>SUBTOTAL Bs.</Typography>
              <Typography>Bs. {(saleDetails?.subtotal ?? 0).toFixed(2)}</Typography>
            </Box>
            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: { xs: '8px', sm: '10px', md: '12px' } }}>
              <Typography>IVA (16%)</Typography>
              <Typography>Bs. {(saleDetails?.tax ?? 0).toFixed(2)}</Typography>
            </Box> */}
            <Divider sx={{ borderStyle: 'dashed', my: 0.5, borderColor: '#666' }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: { xs: '10px', sm: '12px', md: '14px' },
                fontWeight: 'bold',
              }}
            >
              <Typography>TOTAL Bs.</Typography>
              <Typography>Bs. {(saleDetails?.total ?? 0).toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5, borderColor: '#666' }} />
            <Typography sx={{ fontSize: { xs: '8px', sm: '10px', md: '12px' } }}>
              Gracias por su compra
            </Typography>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrint}
              sx={{ py: 1, px: 2, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }}
            >
              Imprimir Ticket
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOpenTicket(false)}
              sx={{ py: 1, px: 2, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>

      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' } }}>
          Confirmar Anulación
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
            ¿Estás seguro de que deseas anular esta venta? Esto devolverá las cantidades al inventario.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCancelDialog(false)}
            sx={{ color: '#1976d2', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={cancelSaleGroup}
            sx={{ color: '#d32f2f', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }}
          >
            Anular Venta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PointOfSale;