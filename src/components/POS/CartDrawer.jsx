import { useState, useCallback, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

function CartDrawer({
  cartDrawerOpen,
  setCartDrawerOpen,
  cart,
  setCart,
  products,
  exchangeRate,
  cashierName,
  error,
  setError,
  paymentMethod,
  setPaymentMethod,
  paymentOptions,
  registerSale,
  IVA_RATE,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [lastRemovedItem, setLastRemovedItem] = useState(null);
  const [secondPaymentMethod, setSecondPaymentMethod] = useState('');
  const [splitAmount, setSplitAmount] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [setCart]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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
    if (cart.length >= 10) {
      setError('Has alcanzado el límite de 10 productos en el carrito.');
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
        stockQuantity: selectedProduct.quantity,
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
  }, [selectedProduct, quantity, exchangeRate, cart, setCart, setError, IVA_RATE]);

  const removeFromCart = useCallback((index) => {
    const removedItem = cart[index];
    setLastRemovedItem({ item: removedItem, index });
    setCart(cart.filter((_, i) => i !== index));
    setSnackbarOpen(true);
  }, [cart, setCart]);

  const undoRemove = () => {
    if (lastRemovedItem) {
      const updatedCart = [...cart];
      updatedCart.splice(lastRemovedItem.index, 0, lastRemovedItem.item);
      setCart(updatedCart);
      setLastRemovedItem(null);
      setSnackbarOpen(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalBs, 0);

  return (
    <Drawer
      anchor="right"
      open={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: 'min(350px, 90%)', sm: '400px', md: '450px', lg: '500px' },
          bgcolor: 'background.paper',
          height: '100%',
          top: 0,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderTopLeftRadius: { xs: 0, sm: '16px' },
          borderBottomLeftRadius: { xs: 0, sm: '16px' },
          transition: 'transform 0.3s ease-in-out',
          transform: cartDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          overflowY: 'auto',
        },
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: '#ffffff',
          height: '100%',
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
      >
        <Box sx={{ pt: { xs: 7, sm: 8 } }} />
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: '#1976d2',
            textAlign: 'center',
            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem', lg: '2rem' },
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bgcolor: '#ffffff',
            pt: 1,
          }}
        >
          🛒 Carrito de Compras
        </Typography>
        <Box sx={{ position: 'sticky', top: '3rem', bgcolor: '#ffffff', zIndex: 1, pb: 1 }}>
          <Typography sx={{ fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '18px' }, fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
            Dxtodito C.A
          </Typography>
          <Typography sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' }, textAlign: 'center', mb: 1 }}>
            Cajero: {cashierName}
          </Typography>
          <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#666' }} />
        </Box>
        {error && (
          <Box sx={{ backgroundColor: '#ffebee', p: 2, borderRadius: '8px', mb: 2 }}>
            <Typography variant="body2" color="error" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
              {error}
            </Typography>
          </Box>
        )}
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
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, padding: { xs: '8px', sm: '10px' } },
                py: { md: 0.8 },
                transition: 'background-color 0.3s',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                },
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
                  <ListItem key={product.id} disablePadding>
                    <ListItemButton
                      onClick={() => selectProduct(product)}
                      sx={{ '&:hover': { backgroundColor: '#e3f2fd' }, py: { xs: 0.5, sm: 1 } }}
                    >
                      <ListItemText primary={product.name} primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }} />
                    </ListItemButton>
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
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } },
              transition: 'background-color 0.3s',
              '&:hover': {
                backgroundColor: '#e3f2fd',
              },
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
            Añadir al Carrito
          </Button>
        </Box>

        {cart.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
            El carrito está vacío
          </Typography>
        ) : (
          <Box sx={{ fontFamily: 'monospace', fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' }, lineHeight: 1.4 }}>
            {cart.length >= 8 && cart.length < 10 && (
              <Box sx={{ backgroundColor: '#fff3cd', p: 1, borderRadius: '8px', mb: 2 }}>
                <Typography variant="body2" color="warning.main" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                  Estás cerca del límite de 10 productos en el carrito.
                </Typography>
              </Box>
            )}
            {cart.length >= 10 && (
              <Box sx={{ backgroundColor: '#ffebee', p: 1, borderRadius: '8px', mb: 2 }}>
                <Typography variant="body2" color="error" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                  Has alcanzado el límite de 10 productos en el carrito.
                </Typography>
              </Box>
            )}
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
                    px: 1,
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                    transition: 'background-color 0.3s',
                    '&:hover': { backgroundColor: '#e3f2fd' },
                  }}
                >
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2">{item.description || 'Sin descripción'}</Typography>
                        <Typography variant="body2">Stock: {item.stockQuantity || 'N/A'}</Typography>
                      </Box>
                    }
                  >
                    <Typography sx={{ flex: 1, fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' } }}>
                      {item.name}
                    </Typography>
                  </Tooltip>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (item.quantity > 1) {
                          const updatedCart = [...cart];
                          updatedCart[index].quantity -= 1;
                          updatedCart[index].subtotalBs = updatedCart[index].priceWithoutIvaBs * updatedCart[index].quantity;
                          updatedCart[index].ivaTotalBs = updatedCart[index].ivaBs * updatedCart[index].quantity;
                          updatedCart[index].totalBs = updatedCart[index].priceWithIvaBs * updatedCart[index].quantity;
                          setCart(updatedCart);
                        }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ mx: 1, fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px' } }}>
                      x {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (item.quantity < item.stockQuantity) {
                          const updatedCart = [...cart];
                          updatedCart[index].quantity += 1;
                          updatedCart[index].subtotalBs = updatedCart[index].priceWithoutIvaBs * updatedCart[index].quantity;
                          updatedCart[index].ivaTotalBs = updatedCart[index].ivaBs * updatedCart[index].quantity;
                          updatedCart[index].totalBs = updatedCart[index].priceWithIvaBs * updatedCart[index].quantity;
                          setCart(updatedCart);
                        } else {
                          setError('No hay suficiente stock disponible');
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
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
            {cart.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setCart([])}
                startIcon={<DeleteIcon />}
                sx={{
                  width: '100%',
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                }}
              >
                Limpiar Carrito
              </Button>
            )}
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
              <InputLabel id="payment-method-label">Método de Pago Principal</InputLabel>
              <Select
                labelId="payment-method-label"
                value={paymentMethod}
                label="Método de Pago Principal"
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                }}
              >
                {paymentOptions.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="second-payment-method-label">Segunda Forma de Pago (Opcional)</InputLabel>
              <Select
                labelId="second-payment-method-label"
                value={secondPaymentMethod}
                label="Segunda Forma de Pago (Opcional)"
                onChange={(e) => setSecondPaymentMethod(e.target.value)}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
                {paymentOptions.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {secondPaymentMethod && (
              <TextField
                label="Monto para Segunda Forma de Pago (Bs.)"
                value={splitAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (value < 0) {
                    setError('El monto no puede ser negativo');
                  } else if (value > cartTotal) {
                    setError('El monto no puede superar el total del carrito');
                  } else if (value === 0) {
                    setError('El monto debe ser mayor que 0');
                  } else {
                    setSplitAmount(value);
                    setError(null);
                  }
                }}
                variant="outlined"
                fullWidth
                type="number"
                sx={{
                  mb: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  '& .MuiInputBase-input': { fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } },
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                }}
              />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => registerSale(cartTotal, splitAmount, secondPaymentMethod)}
              startIcon={<ReceiptIcon />}
              sx={{
                width: '100%',
                py: { xs: 1, sm: '0.8rem', md: '1rem' },
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                backgroundColor: '#1976d2',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.3s',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
                  transform: 'scale(1.02)',
                },
              }}
              disabled={cart.length === 0 || !paymentMethod || (secondPaymentMethod && (!splitAmount || splitAmount <= 0))}
            >
              Registrar Venta y Generar Ticket
            </Button>
          </Box>
        )}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          action={
            <Button color="inherit" onClick={undoRemove}>
              Deshacer
            </Button>
          }
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%' }}>
            Producto eliminado del carrito.
          </Alert>
        </Snackbar>
      </Box>
    </Drawer>
  );
}

export default CartDrawer;