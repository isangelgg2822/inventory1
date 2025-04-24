import { memo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PrintIcon from '@mui/icons-material/Print';
import CancelIcon from '@mui/icons-material/Cancel';

// SaleRow component
const SaleRow = memo(({ group, index, products, reprintTicket, setSelectedSaleGroup, setOpenCancelDialog, userRole }) => {
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
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 1, sm: 1.5 } }}>
        Venta #{index + 1}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 1, sm: 1.5 } }}>
        {formatDate(group.date)}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 1, sm: 1.5 } }}>
        {productNames.join(', ')}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 1, sm: 1.5 } }}>
        {group.userName || 'Desconocido'}
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: { xs: 1, sm: 1.5 } }}>
        {group.total.toFixed(2)}
      </TableCell>
      <TableCell sx={{ py: { xs: 1, sm: 1.5 } }}>
        <Tooltip title="Reimprimir Ticket">
          <IconButton color="primary" onClick={() => reprintTicket(group)}>
            <PrintIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={userRole === 'admin' ? 'Anular Venta' : 'No tienes permisos para anular ventas'}>
          <span>
            <IconButton
              color="secondary"
              onClick={() => {
                if (userRole === 'admin') {
                  setSelectedSaleGroup(group);
                  setOpenCancelDialog(true);
                }
              }}
              disabled={userRole !== 'admin'}
              sx={{
                opacity: userRole === 'admin' ? 1 : 0.5,
                cursor: userRole === 'admin' ? 'pointer' : 'not-allowed',
              }}
            >
              <CancelIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

function SalesTable({ salesGroups, products, reprintTicket, setSelectedSaleGroup, setOpenCancelDialog, userRole, isMobile }) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <Table size={isMobile ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 1, sm: 1.5 } }}>
              Número de Venta
            </TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 1, sm: 1.5 } }}>
              Fecha
            </TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 1, sm: 1.5 } }}>
              Productos
            </TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 1, sm: 1.5 } }}>
              Realizado por
            </TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 1, sm: 1.5 } }}>
              Total (Bs.)
            </TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' }, py: { xs: 1, sm: 1.5 } }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {salesGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} sx={{ textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, py: 2 }}>
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
                userRole={userRole}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SalesTable;