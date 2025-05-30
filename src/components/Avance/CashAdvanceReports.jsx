"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../supabase"
import { startOfDay, endOfDay, format } from "date-fns"
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { CSVLink } from "react-csv"
import BarChartIcon from "@mui/icons-material/BarChart"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import TrendingDownIcon from "@mui/icons-material/TrendingDown"
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import Navbar from "../Navbar"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function CashAdvanceReports() {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [selectedFund, setSelectedFund] = useState("")
  const [transactionType, setTransactionType] = useState("")

  // Estados para estadísticas
  const [summary, setSummary] = useState({
    totalAdvances: 0,
    totalReplenishments: 0,
    netFlow: 0,
    transactionCount: 0,
  })

  useEffect(() => {
    fetchFunds()
  }, [])

  const fetchFunds = async () => {
    try {
      const { data, error } = await supabase
        .from("cash_advance_fund")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setFunds(data || [])
    } catch (error) {
      console.error("Error fetching funds:", error)
      setError("Error al cargar los fondos: " + error.message)
    }
  }

  const fetchTransactions = async () => {
    if (!startDate || !endDate) {
      setError("Por favor, selecciona un rango de fechas.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const startLocal = startDate instanceof Date ? startDate : new Date(startDate)
      const endLocal = endDate instanceof Date ? endDate : new Date(endDate)

      if (isNaN(startLocal) || isNaN(endLocal)) {
        throw new Error("Fechas inválidas seleccionadas.")
      }

      const start = startOfDay(startLocal).toISOString()
      const end = endOfDay(endLocal).toISOString()

      let query = supabase
        .from("cash_advance_transactions")
        .select(`
          *,
          cash_advance_fund (
            description,
            initial_amount,
            current_balance
          )
        `)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false })

      // Filtrar por fondo si está seleccionado
      if (selectedFund) {
        query = query.eq("fund_id", selectedFund)
      }

      // Filtrar por tipo de transacción si está seleccionado
      if (transactionType) {
        query = query.eq("transaction_type", transactionType)
      }

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])

      // Calcular estadísticas
      const advances = data?.filter((t) => t.transaction_type === "advance") || []
      const replenishments = data?.filter((t) => t.transaction_type === "replenishment") || []

      const totalAdvances = advances.reduce((sum, t) => sum + t.amount, 0)
      const totalReplenishments = replenishments.reduce((sum, t) => sum + t.amount, 0)

      setSummary({
        totalAdvances,
        totalReplenishments,
        netFlow: totalReplenishments - totalAdvances,
        transactionCount: data?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Error al cargar las transacciones: " + error.message)
      setTransactions([])
      setSummary({
        totalAdvances: 0,
        totalReplenishments: 0,
        netFlow: 0,
        transactionCount: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    autoTable(doc, {})

    doc.setFontSize(18)
    doc.text("Reporte de Avance de Efectivo", 14, 22)

    doc.setFontSize(12)
    doc.text(
      `Período: ${startDate ? format(startDate, "yyyy-MM-dd") : ""} a ${endDate ? format(endDate, "yyyy-MM-dd") : ""}`,
      14,
      32,
    )

    // Estadísticas
    doc.text(`Total de Avances: Bs. ${summary.totalAdvances.toFixed(2)}`, 14, 42)
    doc.text(`Total de Reposiciones: Bs. ${summary.totalReplenishments.toFixed(2)}`, 14, 52)
    doc.text(`Flujo Neto: Bs. ${summary.netFlow.toFixed(2)}`, 14, 62)
    doc.text(`Total de Transacciones: ${summary.transactionCount}`, 14, 72)

    if (transactions.length > 0) {
      doc.setFontSize(14)
      doc.text("Detalle de Transacciones", 14, 90)
      autoTable(doc, {
        startY: 100,
        head: [["Fecha", "Tipo", "Monto Base (Bs.)", "% Comisión", "Monto Final (Bs.)", "Descripción", "Cajero"]],
        body: transactions.map((transaction) => [
          format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm"),
          transaction.transaction_type === "advance" ? "Avance" : "Reposición",
          transaction.amount.toFixed(2),
          transaction.transaction_type === "advance" ? `${transaction.fee_percentage || 0}%` : "-",
          transaction.transaction_type === "advance"
            ? (transaction.final_amount || transaction.amount).toFixed(2)
            : transaction.amount.toFixed(2),
          transaction.description || "-",
          transaction.cashier_name || "-",
        ]),
      })
    }

    doc.save(
      `reporte-avance-efectivo-${startDate ? format(startDate, "yyyy-MM-dd") : "inicio"}-a-${endDate ? format(endDate, "yyyy-MM-dd") : "fin"}.pdf`,
    )
  }

  const csvData = transactions.map((transaction) => ({
    Fecha: format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm"),
    Tipo: transaction.transaction_type === "advance" ? "Avance" : "Reposición",
    "Monto Base (Bs.)": transaction.amount.toFixed(2),
    "Porcentaje Comisión": transaction.transaction_type === "advance" ? `${transaction.fee_percentage || 0}%` : "-",
    "Monto Final (Bs.)":
      transaction.transaction_type === "advance"
        ? (transaction.final_amount || transaction.amount).toFixed(2)
        : transaction.amount.toFixed(2),
    Descripción: transaction.description || "-",
    Cajero: transaction.cashier_name || "-",
    Fondo: transaction.cash_advance_fund?.description || "-",
  }))

  return (
    <>
      <Navbar open={open} setOpen={setOpen} />
      <Container sx={{ mt: { xs: 8, sm: 0 } }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: "2rem", fontWeight: 600 }}>
          Reportes de Avance de Efectivo
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4, backgroundColor: "#f5f5f5", p: 3, borderRadius: "12px", boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: "#1976d2", fontWeight: 500 }}>
            Filtros de Reporte
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Fecha de Fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Fondo</InputLabel>
                  <Select value={selectedFund} onChange={(e) => setSelectedFund(e.target.value)} label="Fondo">
                    <MenuItem value="">Todos los Fondos</MenuItem>
                    {funds.map((fund) => (
                      <MenuItem key={fund.id} value={fund.id}>
                        {fund.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Transacción</InputLabel>
                  <Select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    label="Tipo de Transacción"
                  >
                    <MenuItem value="">Todos los Tipos</MenuItem>
                    <MenuItem value="advance">Avances</MenuItem>
                    <MenuItem value="replenishment">Reposiciones</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </LocalizationProvider>

          <Button
            variant="contained"
            color="primary"
            onClick={fetchTransactions}
            disabled={loading}
            startIcon={<BarChartIcon />}
            sx={{ mt: 2 }}
          >
            {loading ? "Cargando..." : "Generar Reporte"}
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {transactions.length > 0 && (
          <>
            {/* Estadísticas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#ffebee", boxShadow: 3, borderRadius: "12px" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <TrendingDownIcon sx={{ color: "#d32f2f", mr: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        Total Avances
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                      Bs. {summary.totalAdvances.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#e8f5e8", boxShadow: 3, borderRadius: "12px" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <TrendingUpIcon sx={{ color: "#2e7d32", mr: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        Total Reposiciones
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: "#2e7d32", fontWeight: "bold" }}>
                      Bs. {summary.totalReplenishments.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#e3f2fd", boxShadow: 3, borderRadius: "12px" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <AccountBalanceWalletIcon sx={{ color: "#1976d2", mr: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        Flujo Neto
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        color: summary.netFlow >= 0 ? "#2e7d32" : "#d32f2f",
                        fontWeight: "bold",
                      }}
                    >
                      Bs. {summary.netFlow.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: "#fff3e0", boxShadow: 3, borderRadius: "12px" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <BarChartIcon sx={{ color: "#f57c00", mr: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        Transacciones
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: "#f57c00", fontWeight: "bold" }}>
                      {summary.transactionCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabla de transacciones */}
            <Card sx={{ mb: 4, boxShadow: 3, borderRadius: "12px" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: "#1976d2", fontWeight: 500 }}>
                  Detalle de Transacciones
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Monto Base</TableCell>
                      <TableCell>% Comisión</TableCell>
                      <TableCell>Monto Final</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Cajero</TableCell>
                      <TableCell>Fondo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.transaction_type === "advance" ? "Avance" : "Reposición"}
                            color={transaction.transaction_type === "advance" ? "error" : "success"}
                            size="small"
                            icon={
                              transaction.transaction_type === "advance" ? <TrendingDownIcon /> : <TrendingUpIcon />
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              color: transaction.transaction_type === "advance" ? "#d32f2f" : "#2e7d32",
                              fontWeight: "bold",
                            }}
                          >
                            {transaction.transaction_type === "advance" ? "-" : "+"}Bs. {transaction.amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {transaction.transaction_type === "advance" ? `${transaction.fee_percentage || 0}%` : "-"}
                        </TableCell>
                        <TableCell>
                          {transaction.transaction_type === "advance" ? (
                            <Typography sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                              -Bs. {(transaction.final_amount || transaction.amount).toFixed(2)}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: "#2e7d32", fontWeight: "bold" }}>
                              +Bs. {transaction.amount.toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell>{transaction.cashier_name}</TableCell>
                        <TableCell>{transaction.cash_advance_fund?.description || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Botones de exportación */}
            <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ background: "linear-gradient(90deg, #1976d2, #42a5f5)" }}
              >
                <CSVLink
                  data={csvData}
                  filename={`reporte-avance-efectivo-${startDate ? format(startDate, "yyyy-MM-dd") : "inicio"}-a-${endDate ? format(endDate, "yyyy-MM-dd") : "fin"}.csv`}
                  style={{ textDecoration: "none", color: "#fff" }}
                >
                  Exportar a CSV
                </CSVLink>
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={exportToPDF}
                sx={{ background: "linear-gradient(90deg, #d81b60, #f06292)" }}
              >
                Exportar a PDF
              </Button>
            </Box>
          </>
        )}
      </Container>
    </>
  )
}

export default CashAdvanceReports
