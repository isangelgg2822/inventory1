import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Navbar from '../Navbar';
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete, Edit, Search, Clear } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false); // Estado para controlar el Navbar

  const categories = ['', 'Alimentos', 'Bebidas', 'Hogar'];

  // Función para formatear el precio como cadena con 3 decimales
  const formatPrice = (value) => {
    let val = value || '';
    // Separar la parte entera y decimal
    let [integerPart, decimalPart = ''] = val.split('.');
    
    // Limpiar la parte entera (eliminar caracteres no numéricos, pero permitir signo negativo)
    integerPart = integerPart.replace(/[^0-9-]/g, '');
    if (integerPart === '' || integerPart === '-') integerPart = '0';
    
    // Limpiar la parte decimal (solo números)
    decimalPart = decimalPart.replace(/[^0-9]/g, '');
    
    // Ajustar la parte decimal a 3 dígitos
    if (decimalPart.length === 0) {
      decimalPart = '000';
    } else if (decimalPart.length === 1) {
      decimalPart += '00';
    } else if (decimalPart.length === 2) {
      decimalPart += '0';
    } else if (decimalPart.length > 3) {
      decimalPart = decimalPart.substring(0, 3);
    }
    
    return `${integerPart}.${decimalPart}`;
  };

  // Función para mostrar el precio con 3 decimales en la UI
  const displayPrice = (value) => {
    let val = value || '';
    // Separar la parte entera y decimal
    let [integerPart, decimalPart = ''] = val.split('.');
    
    // Ajustar la parte decimal a 3 dígitos
    if (decimalPart.length === 0) {
      decimalPart = '000';
    } else if (decimalPart.length === 1) {
      decimalPart += '00';
    } else if (decimalPart.length === 2) {
      decimalPart += '0';
    } else if (decimalPart.length > 3) {
      decimalPart = decimalPart.substring(0, 3);
    }
    
    return `${integerPart}.${decimalPart}`;
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data?.user) {
        console.error('Error fetching user:', userError);
        setError('Error al obtener el usuario. Por favor, inicia sesión nuevamente.');
        return;
      }

      const role = data.user.user_metadata?.role || 'user';
      setUserRole(role);
    };

    fetchUserRole();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error);
      setError(`Error al recuperar los productos: ${error.message}`);
      return;
    }
    setProducts(data || []);
    setFilteredProducts(data || []);
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const addProduct = async () => {
    if (!name || !quantity || !price) {
      alert('Por favor, completa todos los campos obligatorios (Nombre, Cantidad, Precio)');
      return;
    }
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data?.user) {
      alert('No se pudo obtener el usuario autenticado');
      return;
    }
    const userId = data.user.id;
    const formattedPrice = formatPrice(price);
    const { error } = await supabase.from('products').insert([
      {
        name,
        quantity: parseInt(quantity),
        price: formattedPrice,
        category: category || null,
        user_id: userId,
      },
    ]);
    if (error) {
      console.error('Error adding product:', error);
      alert(`Error al añadir el producto: ${error.message} (Código: ${error.code})`);
      return;
    }
    fetchProducts();
    setName('');
    setQuantity('');
    setPrice('');
    setCategory('');
  };

  const deleteProduct = async () => {
    if (!selectedProduct) return;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', selectedProduct.id);
    if (error) {
      console.error('Error deleting product:', error);
      alert(`Error al eliminar el producto: ${error.message} (Código: ${error.code})`);
      return;
    }
    setOpenDeleteDialog(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const openEditModalHandler = (product) => {
    setSelectedProduct(product);
    setEditName(product.name);
    setEditQuantity(product.quantity.toString());
    setEditPrice(product.price || '0.000');
    setEditCategory(product.category || '');
    setOpenEditModal(true);
  };

  const saveEditProduct = async () => {
    if (!editName || !editQuantity || !editPrice) {
      alert('Por favor, completa todos los campos obligatorios (Nombre, Cantidad, Precio)');
      return;
    }
    const formattedPrice = formatPrice(editPrice);
    const { error } = await supabase
      .from('products')
      .update({
        name: editName,
        quantity: parseInt(editQuantity),
        price: formattedPrice,
        category: editCategory || null,
      })
      .eq('id', selectedProduct.id);
    if (error) {
      console.error('Error updating product:', error);
      alert(`Error al actualizar el producto: ${error.message} (Código: ${error.code})`);
      return;
    }
    setOpenEditModal(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  if (error) {
    return (
      <Container sx={{ mt: { xs: 8, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '2rem', fontWeight: 600 }}>
          Inventario
        </Typography>
        <Box sx={{ backgroundColor: '#ffebee', p: { xs: 2, sm: 3 }, borderRadius: '12px', mb: 2 }}>
          <Typography variant="h6" color="error" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <>
      <Navbar open={open} setOpen={setOpen} />
      <Container sx={{ mt: { xs: 8, sm: 0 } }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '2rem', fontWeight: 600 }}>
          Inventario
        </Typography>

        <Box sx={{ mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: '12px', boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
            Añadir Producto
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ width: { xs: '100%', sm: '300px' } }}
              disabled={!isAdmin}
            />
            <TextField
              label="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              variant="outlined"
              size="small"
              type="number"
              sx={{ width: { xs: '100%', sm: '150px' } }}
              disabled={!isAdmin}
            />
            <TextField
              label="Precio (USD)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              variant="outlined"
              size="small"
              type="text"
              inputProps={{ pattern: "\\d*\\.?\\d{0,3}" }}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ width: { xs: '100%', sm: '150px' } }}
              disabled={!isAdmin}
            />
            <FormControl variant="outlined" sx={{ width: { xs: '100%', sm: '200px' } }} disabled={!isAdmin}>
              <InputLabel id="category-label">Categoría (opcional)</InputLabel>
              <Select
                labelId="category-label"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Categoría (opcional)"
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {categories.filter(cat => cat !== '').map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title={isAdmin ? "Añadir producto" : "No tienes permiso para añadir productos"}>
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addProduct}
                  startIcon={<AddIcon />}
                  sx={{ py: 1.5, px: 3, width: { xs: '100%', sm: 'auto' } }}
                  disabled={!isAdmin}
                >
                  Añadir
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <TextField
            label="Buscar producto"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: '300px' }, backgroundColor: '#fff', borderRadius: '8px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#1976d2' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch}>
                    <Clear sx={{ color: '#1976d2' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Precio (USD)</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{product.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{product.category || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{product.quantity}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>${displayPrice(product.price)}</TableCell>
                  <TableCell>
                    <Tooltip title={isAdmin ? "Editar" : "No tienes permiso para editar"}>
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => openEditModalHandler(product)}
                          disabled={!isAdmin}
                        >
                          <Edit sx={{ fontSize: 26 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={isAdmin ? "Eliminar" : "No tienes permiso para eliminar"}>
                      <span>
                        <IconButton
                          color="secondary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setOpenDeleteDialog(true);
                          }}
                          disabled={!isAdmin}
                        >
                          <Delete sx={{ fontSize: 26 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
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
          <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 500 }}>
            Editar Producto
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre del producto"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              variant="outlined"
              fullWidth
            />
            <FormControl variant="outlined" fullWidth>
              <InputLabel id="edit-category-label">Categoría (opcional)</InputLabel>
              <Select
                labelId="edit-category-label"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                label="Categoría (opcional)"
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {categories.filter(cat => cat !== '').map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Cantidad"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              variant="outlined"
              type="number"
              fullWidth
            />
            <TextField
              label="Precio (USD)"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              variant="outlined"
              type="text"
              inputProps={{ pattern: "\\d*\\.?\\d{0,3}" }}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={saveEditProduct}
                sx={{ py: 1.5, px: 3 }}
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenEditModal(false)}
                sx={{ py: 1.5, px: 3 }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto "{selectedProduct?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ color: '#1976d2', fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={deleteProduct}
            sx={{ color: '#d32f2f', fontWeight: 500 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Inventory;