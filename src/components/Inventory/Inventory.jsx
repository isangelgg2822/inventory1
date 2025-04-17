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

  const categories = [
    '',
    'Alimentos',
    'Bebidas',
    'Hogar',
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('No se pudo obtener el usuario autenticado');
      return;
    }
    const userId = user.id;
    const { error } = await supabase.from('products').insert([
      {
        name,
        quantity: parseInt(quantity),
        price: parseFloat(price),
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
    setEditPrice(product.price.toString());
    setEditCategory(product.category || '');
    setOpenEditModal(true);
  };

  const saveEditProduct = async () => {
    if (!editName || !editQuantity || !editPrice) {
      alert('Por favor, completa todos los campos obligatorios (Nombre, Cantidad, Precio)');
      return;
    }
    const { error } = await supabase
      .from('products')
      .update({
        name: editName,
        quantity: parseInt(editQuantity),
        price: parseFloat(editPrice),
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

  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h1" gutterBottom sx={{ fontSize: '2.5rem', fontWeight: 600 }}>
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
              size="medium"
              sx={{ width: { xs: '100%', sm: '300px' } }}
            />
            <TextField
              label="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              variant="outlined"
              size="medium"
              type="number"
              sx={{ width: { xs: '100%', sm: '150px' } }}
            />
            <TextField
              label="Precio (USD)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              variant="outlined"
              size="medium"
              type="number"
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ width: { xs: '100%', sm: '150px' } }}
            />
            <FormControl variant="outlined" sx={{ width: { xs: '100%', sm: '200px' } }}>
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
            <Button
              variant="contained"
              color="primary"
              onClick={addProduct}
              startIcon={<AddIcon />}
              sx={{ py: 1.5, px: 3, width: { xs: '100%', sm: 'auto' } }}
            >
              Añadir
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <TextField
            label="Buscar producto"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="medium"
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
                <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Precio (USD)</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell sx={{ fontSize: '1rem' }}>{product.name}</TableCell>
                  <TableCell sx={{ fontSize: '1rem' }}>{product.category || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '1rem' }}>{product.quantity}</TableCell>
                  <TableCell sx={{ fontSize: '1rem' }}>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar">
                      <IconButton color="primary" onClick={() => openEditModalHandler(product)}>
                        <Edit sx={{ fontSize: 28 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setSelectedProduct(product);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <Delete sx={{ fontSize: 28 }} />
                      </IconButton>
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
              type="number"
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