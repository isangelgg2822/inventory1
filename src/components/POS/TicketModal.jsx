import { useCallback, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

function TicketModal({ openTicket, setOpenTicket, saleDetails, cashierName, isMobile, setError }) {
  // Log para depurar saleDetails
  useEffect(() => {
    if (openTicket) {
      console.log('saleDetails en TicketModal:', saleDetails);
    }
  }, [openTicket, saleDetails]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes para este sitio.');
      return;
    }
    const content = `
    
      <html>
      
        <body style="font-family: Arial, sans-serif; font-size: 10px; margin-top:0; padding: 10px; background-color: #f5f5f5;">

          <div style="text-align: center; width: 48mm; margin: 0 auto; background-color: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

            <p style="margin: 2px 0; font-size: 14px; font-weight: bold; color: #2e7d32;">🛒 Dxtodito C.A</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">Nota de Entrega #${saleDetails?.saleNumber ?? 'N/A'}</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">Fecha: ${saleDetails?.date ?? 'N/A'}</p>
            <p style="margin: 4px 0; font-size: 10px; color: #555;">Cajero: ${cashierName ?? 'Desconocido'}</p>
            <hr style="border: 1px dashed #999; margin: 10px 0;" />
            ${saleDetails?.items
              ?.map(
                (item) =>
                  `
                    <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                      <span style="font-size: 10px; text-align: left;">${item?.name ?? 'Producto Desconocido'} x ${item?.quantity ?? 0}</span>
                      <span style="font-size: 10px; text-align: right;">Bs. ${(item?.totalBs ?? 0).toFixed(2)}</span>
                    </div>
                  `
              )
              .join('') ?? ''}
            <hr style="border: 1px dashed #999; margin: 10px 0;" />
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <p style="font-size: 10px; font-weight: bold; text-align: left;">${saleDetails?.primaryPaymentMethod === 'Divisa' ? 'TOTAL $' : 'TOTAL Bs.'}</p>
              <p style="font-size: 10px; font-weight: bold; text-align: right;">${saleDetails?.primaryPaymentMethod === 'Divisa' ? `$ ${(saleDetails?.total / saleDetails?.exchangeRate).toFixed(2)}` : `Bs. ${(saleDetails?.total ?? 0).toFixed(2)}`}</p>
            </div>
            <hr style="border: 1px dashed #999; margin: 10px 0;" />
            <p style="margin: 4px 0; font-size: 10px; text-align: left;">Método de Pago: ${saleDetails?.primaryPaymentMethod ?? saleDetails?.paymentMethod ?? 'N/A'} - ${saleDetails?.primaryPaymentMethod === 'Divisa' ? `$ ${(saleDetails?.paidAmount ?? saleDetails?.total ?? 0) / saleDetails?.exchangeRate}` : `Bs. ${(saleDetails?.paidAmount ?? saleDetails?.total ?? 0).toFixed(2)}`}</p>
            ${saleDetails?.secondPaymentMethod ? `<p style="margin: 4px 0; font-size: 12px; text-align: left;">Método de Pago: ${saleDetails?.secondPaymentMethod ?? 'N/A'} - ${saleDetails?.secondPaymentMethod === 'Divisa' ? `$ ${(saleDetails?.secondPaidAmount ?? 0) / saleDetails?.exchangeRate}` : `Bs. ${(saleDetails?.secondPaidAmount ?? 0).toFixed(2)}`}</p>` : ''}
            <hr style="border: 1px dashed #999; margin: 10px 0;" />
            <p style="margin: 4px 0; font-size: 10px; color: #2e7d32;">Gracias por su compra</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [saleDetails, cashierName, setError]);

  if (!saleDetails) {
    return (
      <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '350px', md: '400px' },
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: '12px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <Typography sx={{ textAlign: 'center', color: '#555' }}>
            Cargando detalles de la venta...
          </Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '350px', md: '400px' },
          bgcolor: '#f5f5f5',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderRadius: '12px',
          p: { xs: 2, sm: 3, md: 4 },
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '8px',
            p: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
            <ShoppingCartIcon sx={{ color: '#2e7d32', mr: 1 }} />
            <Typography
              sx={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#2e7d32',
              }}
            >
              Dxtodito C.A
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.9rem', color: '#555', textAlign: 'center', mb: 0.5 }}>
            Nota de Entrega #{saleDetails.saleNumber ?? 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#555', textAlign: 'center', mb: 0.5 }}>
            Fecha: {saleDetails.date ?? 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#555', textAlign: 'center', mb: 0.5 }}>
            Cajero: {cashierName ?? 'Desconocido'}
          </Typography>
          <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: '#999' }} />
          {saleDetails.items?.length > 0 ? (
            saleDetails.items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'left' }}>
                  {item?.name ?? 'Producto Desconocido'} x {item?.quantity ?? 0}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', textAlign: 'right' }}>
                  Bs. {(item?.totalBs ?? 0).toFixed(2)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'center', color: '#555', mb: 1 }}>
              No hay productos en esta venta.
            </Typography>
          )}
          <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: '#999' }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {saleDetails.primaryPaymentMethod === 'Divisa' ? 'TOTAL $' : 'TOTAL Bs.'}
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {saleDetails.primaryPaymentMethod === 'Divisa' ? `$ ${(saleDetails.total / saleDetails.exchangeRate).toFixed(2)}` : `Bs. ${(saleDetails.total ?? 0).toFixed(2)}`}
            </Typography>
          </Box>
          <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: '#999' }} />
          <Typography sx={{ fontSize: '0.9rem', textAlign: 'left', mb: 0.5 }}>
            Método de Pago: {saleDetails.primaryPaymentMethod ?? saleDetails.paymentMethod ?? 'N/A'} - {saleDetails.primaryPaymentMethod === 'Divisa' ? `$ ${(saleDetails.paidAmount ?? saleDetails.total ?? 0) / saleDetails.exchangeRate}` : `Bs. ${(saleDetails.paidAmount ?? saleDetails.total ?? 0).toFixed(2)}`}
          </Typography>
          {saleDetails.secondPaymentMethod && (
            <Typography sx={{ fontSize: '0.9rem', textAlign: 'left', mb: 0.5 }}>
              Método de Pago: {saleDetails.secondPaymentMethod} - {saleDetails.secondPaymentMethod === 'Divisa' ? `$ ${(saleDetails.secondPaidAmount ?? 0) / saleDetails.exchangeRate}` : `Bs. ${(saleDetails.secondPaidAmount ?? 0).toFixed(2)}`}
            </Typography>
          )}
          <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: '#999' }} />
          
          <Typography sx={{ fontSize: '0.9rem', color: '#2e7d32', textAlign: 'center', mb: 2 }}>
            Gracias por su compra
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrint}
            sx={{ py: 1, px: 2, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            Imprimir Ticket
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenTicket(false)}
            sx={{ py: 1, px: 2, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, borderColor: '#2e7d32', color: '#2e7d32' }}
          >
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default TicketModal;