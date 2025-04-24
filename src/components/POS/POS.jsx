import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { v4 as uuidv4 } from 'uuid';
import { useDashboard } from '../../context/DashboardHooks';
import { useDrawer } from '../../context/DrawerHooks';
import { useNavigate } from 'react-router-dom';
import CartDrawer from './CartDrawer';
import TicketModal from './TicketModal';
import CancelDialog from './CancelDialog';
import SalesTable from './SalesTable';

// IVA Rate constant
const IVA_RATE = 0.16;

function PointOfSale() {
  const [products, setProducts] = useState([]);
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
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const { fetchDailySales, fetchTotalProducts } = useDashboard();
  const { open, isMobile } = useDrawer();

  // Payment options
  const paymentOptions = [
    'Efectivo Bs',
    'Divisa',
    'Débito',
    'Biopago',
    'Pago Móvil',
    'Avance de Efectivo',
  ];

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setError('No se pudo autenticar el usuario. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      setUserRole(user.user_metadata.role || 'user');
    };
    fetchUserRole();
  }, [navigate]);

  // Fetch cashier name
  useEffect(() => {
    const fetchCashierName = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setCashierName('Usuario');
        return;
      }
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', user.id)
        .single();
      if (userDataError || !userData) {
        setCashierName('Usuario');
        return;
      }
      setCashierName(userData.first_name || 'Usuario');
    };
    fetchCashierName();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').limit(50);
    if (error) {
      setError(`Error al recuperar los productos: ${error.message} (Código: ${error.code})`);
      setProducts([]);
      return;
    }
    setProducts(data || []);
  }, []);

  // Fetch exchange rate
  const fetchExchangeRate = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .is('user_id', null);
    if (error) {
      setError(`Error al recuperar la tasa de cambio: ${error.message} (Código: ${error.code})`);
      return;
    }
    if (data && data.length > 0) {
      if (data.length > 1) {
        setError('Se encontraron múltiples tasas de cambio globales. Por favor, corrige esto en la configuración.');
        return;
      }
      setExchangeRate(parseFloat(data[0].value) || 1);
    } else {
      setError('No se encontró una tasa de cambio global. Por favor, solicita al administrador que la configure.');
      setExchangeRate(null);
    }
  }, []);

  // Handle sales data grouping
  const handleSalesData = useCallback((sales, saleGroupsWithUsers) => {
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
      if (!groupId) return acc;
      if (!acc[groupId]) {
        const saleGroup = saleGroupsWithUsers.find(sg => sg.sale_group_id === groupId);
        acc[groupId] = {
          sale_group_id: groupId,
          items: [],
          total: 0,
          date: sale.created_at || new Date(sale.id).toISOString(),
          userName: saleGroup ? saleGroup.user_first_name : 'Desconocido',
        };
      }
      acc[groupId].items.push(sale);
      acc[groupId].total += sale.total;
      return acc;
    }, {});
    setSalesGroups(Object.values(groupedSales));
  }, []);

  // Fetch sales groups
  const fetchSalesGroups = useCallback(async () => {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (salesError) {
      const { data: fallbackSales, error: fallbackError } = await supabase
        .from('sales')
        .select('*')
        .order('id', { ascending: false })
        .limit(20);
      if (fallbackError) {
        setError(`Error al recuperar las ventas (fallback): ${fallbackError.message} (Código: ${fallbackError.code})`);
        setSalesGroups([]);
        return;
      }
      const saleGroupIds = [...new Set(fallbackSales.map(sale => sale.sale_group_id))];
      const { data: saleGroups, error: saleGroupsError } = await supabase
        .from('sale_groups')
        .select('sale_group_id, user_id')
        .in('sale_group_id', saleGroupIds);
      if (saleGroupsError) {
        setError(`Error al recuperar los grupos de venta: ${saleGroupsError.message} (Código: ${saleGroupsError.code})`);
        setSalesGroups([]);
        return;
      }
      const userIds = [...new Set(saleGroups.map(sg => sg.user_id))];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name')
        .in('id', userIds);
      if (usersError) {
        setError(`Error al recuperar los usuarios: ${usersError.message} (Código: ${usersError.code})`);
        setSalesGroups([]);
        return;
      }
      const saleGroupsWithUsers = saleGroups.map(sg => {
        const user = users.find(u => u.id === sg.user_id);
        return { ...sg, user_first_name: user ? user.first_name : 'Desconocido' };
      });
      handleSalesData(fallbackSales, saleGroupsWithUsers);
      return;
    }
    const saleGroupIds = [...new Set(sales.map(sale => sale.sale_group_id))];
    const { data: saleGroups, error: saleGroupsError } = await supabase
      .from('sale_groups')
      .select('sale_group_id, user_id')
      .in('sale_group_id', saleGroupIds);
    if (saleGroupsError) {
      setError(`Error al recuperar los grupos de venta: ${saleGroupsError.message} (Código: ${saleGroupsError.code})`);
      setSalesGroups([]);
      return;
    }
    const userIds = [...new Set(saleGroups.map(sg => sg.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name')
      .in('id', userIds);
    if (usersError) {
      setError(`Error al recuperar los usuarios: ${usersError.message} (Código: ${usersError.code})`);
      setSalesGroups([]);
      return;
    }
    const saleGroupsWithUsers = saleGroups.map(sg => {
      const user = users.find(u => u.id === sg.user_id);
      return { ...sg, user_first_name: user ? user.first_name : 'Desconocido' };
    });
    handleSalesData(sales, saleGroupsWithUsers);
  }, [handleSalesData]);

  // Initial data fetching
  useEffect(() => {
    fetchProducts();
    fetchExchangeRate();
    fetchSalesGroups();
  }, [fetchProducts, fetchExchangeRate, fetchSalesGroups]);

  // Register sale
  const registerSale = useCallback(async () => {
    if (!paymentMethod) {
      setError('Por favor, selecciona un método de pago');
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
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
          setError(`Error al registrar la venta: ${insertError.message} (Código: ${insertError.code})`);
          return;
        }
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', item.id);
        if (updateError) {
          setError(`Error al actualizar el inventario: ${updateError.message} (Código: ${updateError.code})`);
          return;
        }
      }
      const subtotalBs = cart.reduce((sum, item) => sum + item.subtotalBs, 0);
      const taxBs = cart.reduce((sum, item) => sum + item.ivaTotalBs, 0);
      const totalBs = cart.reduce((sum, item) => sum + item.totalBs, 0);
      const saleNumber = Math.floor(Math.random() * 10000);
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
        setError(`Error al registrar los detalles de la venta: ${insertGroupError.message} (Código: ${insertGroupError.code})`);
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
      setError(`Error inesperado al registrar la venta: ${error.message || 'Error desconocido'}`);
    }
  }, [cart, paymentMethod, navigate, fetchProducts, fetchSalesGroups, fetchDailySales, fetchTotalProducts, isMobile]);

  // Reprint ticket
  const reprintTicket = useCallback(async (saleGroup) => {
    const { data: saleGroupDetails, error } = await supabase
      .from('sale_groups')
      .select('*')
      .eq('sale_group_id', saleGroup.sale_group_id)
      .single();
    if (error || !saleGroupDetails) {
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
  }, [products]);

  // Cancel sale group
  const cancelSaleGroup = useCallback(async () => {
    if (!selectedSaleGroup || userRole !== 'admin') {
      setError('Solo los administradores pueden anular ventas.');
      setOpenCancelDialog(false);
      setSelectedSaleGroup(null);
      return;
    }
    const { error: cancelError } = await supabase
      .from('sales')
      .update({ is_canceled: true })
      .eq('sale_group_id', selectedSaleGroup.sale_group_id);
    if (cancelError) {
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
  }, [selectedSaleGroup, products, userRole, fetchSalesGroups, fetchProducts, fetchDailySales, fetchTotalProducts]);

  // Error handling UI
  if (error && !error.includes('tasa de cambio')) {
    return (
      <Container sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h1"
          gutterBottom
          sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem', lg: '2.5rem' }, fontWeight: 600, color: '#1976d2' }}
        >
          Punto de Venta
        </Typography>
        <Box sx={{ backgroundColor: '#ffebee', p: { xs: 2, sm: 3 }, borderRadius: '12px', mb: 2 }}>
          <Typography variant="h6" color="error" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' } }}>
            {error}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/settings')}
          sx={{ py: 1, px: 2, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' } }}
        >
          Ir a Configuración
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3, lg: 4 },
          ml: { sm: open ? '240px' : 0, lg: open ? '280px' : 0 },
          mt: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 4, sm: 6 },
          width: {
            xs: '100%',
            sm: open ? 'calc(100% - 240px)' : '100%',
            lg: open ? 'calc(100% - 280px)' : '100%',
          },
          maxWidth: { xl: '1920px' },
          mx: { xl: 'auto' },
          transition: 'margin-left 0.3s, width 0.3s',
        }}
      >
        <Container sx={{ px: { xs: 0, sm: 1, md: 2, lg: 3 }, maxWidth: '100%' }}>
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem', lg: '2.5rem' },
              fontWeight: 600,
              color: '#1976d2',
            }}
          >
            Punto de Venta
          </Typography>
          <Divider sx={{ mb: { xs: 2, sm: 3, md: 6 }, borderColor: '#e0e0e0' }} />

          <Button
            variant="contained"
            onClick={() => setCartDrawerOpen(true)}
            startIcon={<ShoppingCartIcon />}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              whiteSpace: 'nowrap',
              mb: { xs: 2, sm: 3, md: 4 },
              py: { xs: 1, sm: 1.2, md: 1.5 },
              px: { xs: 3, sm: 4, md: 5 },
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              backgroundColor: '#1976d2',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.3s',
              '&:hover': {
                backgroundColor: '#1565c0',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
                transform: 'scale(1.02)',
              },
            }}
          >
            Gestionar Carrito ({cart.length})
          </Button>

          <Typography
            variant="h2"
            sx={{
              mt: { xs: 2, sm: 3, md: 4 },
              mb: { xs: 1, sm: 2 },
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem', lg: '2rem' },
              fontWeight: 500,
              color: '#1976d2',
            }}
          >
            Ventas Recientes
          </Typography>
          <SalesTable
            salesGroups={salesGroups}
            products={products}
            reprintTicket={reprintTicket}
            setSelectedSaleGroup={setSelectedSaleGroup}
            setOpenCancelDialog={setOpenCancelDialog}
            userRole={userRole}
            isMobile={isMobile}
          />
        </Container>
      </Box>

      <CartDrawer
        cartDrawerOpen={cartDrawerOpen}
        setCartDrawerOpen={setCartDrawerOpen}
        cart={cart}
        setCart={setCart}
        products={products}
        exchangeRate={exchangeRate}
        cashierName={cashierName}
        error={error}
        setError={setError}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentOptions={paymentOptions}
        registerSale={registerSale}
        IVA_RATE={IVA_RATE}
        isMobile={isMobile}
      />

      <TicketModal
        openTicket={openTicket}
        setOpenTicket={setOpenTicket}
        saleDetails={saleDetails}
        cashierName={cashierName}
        isMobile={isMobile}
        setError={setError}
      />

      <CancelDialog
        openCancelDialog={openCancelDialog}
        setOpenCancelDialog={setOpenCancelDialog}
        cancelSaleGroup={cancelSaleGroup}
      />
    </Box>
  );
}

export default PointOfSale;