"use client"

import { useCallback, useEffect } from "react"
import Modal from "@mui/material/Modal"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Button from "@mui/material/Button"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"

function TicketModal({ openTicket, setOpenTicket, saleDetails, cashierName, isMobile, setError }) {
  // Log para depurar saleDetails
  useEffect(() => {
    if (openTicket) {
      console.log("saleDetails en TicketModal:", saleDetails)
    }
  }, [openTicket, saleDetails])

  // Función para formatear texto con ancho fijo
  const formatLine = (left, right, width = 32) => {
    // Asegurarse de que left y right sean strings
    const leftStr = String(left || "")
    const rightStr = String(right || "")

    // Truncar el texto izquierdo si es demasiado largo
    const maxLeftWidth = width - rightStr.length - 1
    const truncatedLeft = leftStr.length > maxLeftWidth ? leftStr.substring(0, maxLeftWidth - 3) + "..." : leftStr

    // Calcular espacios necesarios
    const spaces = width - truncatedLeft.length - rightStr.length

    // Retornar la línea formateada
    return truncatedLeft + " ".repeat(Math.max(1, spaces)) + rightStr
  }

  // Función para centrar texto
  const centerText = (text, width = 32) => {
    const textStr = String(text || "")
    if (textStr.length >= width) return textStr
    const leftPadding = Math.floor((width - textStr.length) / 2)
    return " ".repeat(leftPadding) + textStr
  }

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      setError("No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes para este sitio.")
      return
    }

    // Crear contenido optimizado para impresora térmica Roccia R-C5801
    let ticketContent = ""

    // Encabezado centrado
    ticketContent += centerText("DXTODITO C.A") + "\n"
    ticketContent += centerText("NOTA DE ENTREGA") + "\n"
    ticketContent += centerText("--------------------------------") + "\n"

    // Información de la venta
    ticketContent += `Ticket: ${saleDetails?.saleNumber ?? "N/A"}\n`
    ticketContent += `Fecha: ${saleDetails?.date ?? "N/A"}\n`
    ticketContent += `Cajero: ${cashierName ?? "Desconocido"}\n`
    ticketContent += "--------------------------------\n"

    // Productos
    if (saleDetails?.items?.length > 0) {
      saleDetails.items.forEach((item) => {
        const itemName = item?.name ?? "Producto"
        const quantity = item?.quantity ?? 0
        const price = (item?.totalBs ?? 0).toFixed(2)

        ticketContent += `${itemName}\n`
        ticketContent += formatLine(`x${quantity}`, `Bs.${price}`) + "\n"
      })
    } else {
      ticketContent += "No hay productos en esta venta.\n"
    }

    ticketContent += "--------------------------------\n"

    // Total
    const totalLabel = saleDetails?.primaryPaymentMethod === "Divisa" ? "TOTAL $" : "TOTAL Bs."
    const totalAmount =
      saleDetails?.primaryPaymentMethod === "Divisa"
        ? `$${(saleDetails?.total / saleDetails?.exchangeRate).toFixed(2)}`
        : `Bs.${(saleDetails?.total ?? 0).toFixed(2)}`

    ticketContent += formatLine(totalLabel, totalAmount) + "\n"
    ticketContent += "--------------------------------\n"

    // Métodos de pago
    const primaryMethod = saleDetails?.primaryPaymentMethod ?? saleDetails?.paymentMethod ?? "N/A"
    const primaryAmount =
      saleDetails?.primaryPaymentMethod === "Divisa"
        ? `$${((saleDetails?.paidAmount ?? saleDetails?.total ?? 0) / saleDetails?.exchangeRate).toFixed(2)}`
        : `Bs.${(saleDetails?.paidAmount ?? saleDetails?.total ?? 0).toFixed(2)}`

    ticketContent += `Pago: ${primaryMethod}\n`
    ticketContent += `Monto: ${primaryAmount}\n`

    if (saleDetails?.secondPaymentMethod) {
      const secondMethod = saleDetails.secondPaymentMethod
      const secondAmount =
        saleDetails.secondPaymentMethod === "Divisa"
          ? `$${((saleDetails?.secondPaidAmount ?? 0) / saleDetails?.exchangeRate).toFixed(2)}`
          : `Bs.${(saleDetails?.secondPaidAmount ?? 0).toFixed(2)}`

      ticketContent += `Pago 2: ${secondMethod}\n`
      ticketContent += `Monto: ${secondAmount}\n`
    }

    ticketContent += "--------------------------------\n"

    // Mensaje final centrado
    ticketContent += centerText("GRACIAS POR SU COMPRA") + "\n"

    // Espacio para corte
    ticketContent += "\n\n\n"

    // Crear el HTML para la impresión
    const content = `
      <html>
        <head>
          <style>
            @page {
              margin: 0;
              padding: 0;
              width: 80mm;
              height: auto;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              width: 80mm;
              background-color: white;
            }
            pre {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              white-space: pre;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <pre>${ticketContent}</pre>
        </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()

    // Usar setTimeout para asegurar que el contenido se cargue antes de imprimir
    setTimeout(() => {
      printWindow.print()
      // Cerrar la ventana después de imprimir
      printWindow.close()
    }, 500)
  }, [saleDetails, cashierName, setError])

  if (!saleDetails) {
    return (
      <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "350px", md: "400px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: "12px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography sx={{ textAlign: "center", color: "#555" }}>Cargando detalles de la venta...</Typography>
        </Box>
      </Modal>
    )
  }

  return (
    <Modal open={openTicket} onClose={() => setOpenTicket(false)}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: "350px", md: "400px" },
          bgcolor: "#f5f5f5",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          borderRadius: "12px",
          p: { xs: 2, sm: 3, md: 4 },
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "8px",
            p: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 1 }}>
            <ShoppingCartIcon sx={{ color: "#2e7d32", mr: 1 }} />
            <Typography
              sx={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#2e7d32",
              }}
            >
              Dxtodito C.A
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.9rem", color: "#555", textAlign: "center", mb: 0.5 }}>
            Nota de Entrega #{saleDetails.saleNumber ?? "N/A"}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem", color: "#555", textAlign: "center", mb: 0.5 }}>
            Fecha: {saleDetails.date ?? "N/A"}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem", color: "#555", textAlign: "center", mb: 0.5 }}>
            Cajero: {cashierName ?? "Desconocido"}
          </Typography>
          <Divider sx={{ my: 1.5, borderStyle: "dashed", borderColor: "#999" }} />
          {saleDetails.items?.length > 0 ? (
            saleDetails.items.map((item, index) => (
              <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ fontSize: "0.9rem", textAlign: "left" }}>
                  {item?.name ?? "Producto Desconocido"} x {item?.quantity ?? 0}
                </Typography>
                <Typography sx={{ fontSize: "0.9rem", textAlign: "right" }}>
                  Bs. {(item?.totalBs ?? 0).toFixed(2)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ fontSize: "0.9rem", textAlign: "center", color: "#555", mb: 1 }}>
              No hay productos en esta venta.
            </Typography>
          )}
          <Divider sx={{ my: 1.5, borderStyle: "dashed", borderColor: "#999" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontSize: "1rem", fontWeight: "bold" }}>
              {saleDetails.primaryPaymentMethod === "Divisa" ? "TOTAL $" : "TOTAL Bs."}
            </Typography>
            <Typography sx={{ fontSize: "1rem", fontWeight: "bold" }}>
              {saleDetails.primaryPaymentMethod === "Divisa"
                ? `$ ${(saleDetails.total / saleDetails.exchangeRate).toFixed(2)}`
                : `Bs. ${(saleDetails.total ?? 0).toFixed(2)}`}
            </Typography>
          </Box>
          <Divider sx={{ my: 1.5, borderStyle: "dashed", borderColor: "#999" }} />
          <Typography sx={{ fontSize: "0.9rem", textAlign: "left", mb: 0.5 }}>
            Método de Pago: {saleDetails.primaryPaymentMethod ?? saleDetails.paymentMethod ?? "N/A"} -{" "}
            {saleDetails.primaryPaymentMethod === "Divisa"
              ? `$ ${((saleDetails.paidAmount ?? saleDetails.total ?? 0) / saleDetails.exchangeRate).toFixed(2)}`
              : `Bs. ${(saleDetails.paidAmount ?? saleDetails.total ?? 0).toFixed(2)}`}
          </Typography>
          {saleDetails.secondPaymentMethod && (
            <Typography sx={{ fontSize: "0.9rem", textAlign: "left", mb: 0.5 }}>
              Método de Pago: {saleDetails.secondPaymentMethod} -{" "}
              {saleDetails.secondPaymentMethod === "Divisa"
                ? `$ ${((saleDetails.secondPaidAmount ?? 0) / saleDetails.exchangeRate).toFixed(2)}`
                : `Bs. ${(saleDetails.secondPaidAmount ?? 0).toFixed(2)}`}
            </Typography>
          )}
          <Divider sx={{ my: 1.5, borderStyle: "dashed", borderColor: "#999" }} />

          <Typography sx={{ fontSize: "0.9rem", color: "#2e7d32", textAlign: "center", mb: 2 }}>
            Gracias por su compra
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrint}
            sx={{
              py: 1,
              px: 2,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
              bgcolor: "#2e7d32",
              "&:hover": { bgcolor: "#1b5e20" },
            }}
          >
            Imprimir Ticket
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenTicket(false)}
            sx={{
              py: 1,
              px: 2,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
              borderColor: "#2e7d32",
              color: "#2e7d32",
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default TicketModal
