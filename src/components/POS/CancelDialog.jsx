import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

function CancelDialog({ openCancelDialog, setOpenCancelDialog, cancelSaleGroup }) {
  return (
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
  );
}

export default CancelDialog;