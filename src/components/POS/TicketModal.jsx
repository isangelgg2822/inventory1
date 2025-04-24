import { useCallback, useRef } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';

function TicketModal({ openTicket, setOpenTicket, saleDetails, cashierName, isMobile, setError }) {
  const componentRef = useRef();

  const handlePrint = useCallback(() => {
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
          <div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span>IVA (16%)</span>
            <span>Bs. ${(saleDetails?.tax ?? 0).toFixed(2)}</span>
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

  return (
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
            fontSize: { xs: '8px', sm: '10px', md: '12px' },
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
  );
}

export default TicketModal;