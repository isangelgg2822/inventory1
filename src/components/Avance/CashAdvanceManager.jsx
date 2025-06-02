"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../supabase"
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material"
import { format } from "date-fns"
import AddIcon from "@mui/icons-material/Add"
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import TrendingDownIcon from "@mui/icons-material/TrendingDown"
import InfoIcon from "@mui/icons-material/Info"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import Navbar from "../Navbar"

function CashAdvanceManager() {
  const [funds, setFunds] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [open, setOpen] = useState(false)

  // Estados para diálogos
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionPreview, setTransactionPreview] = useState(null)

  // Estados para edición y eliminación
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [editTransaction, setEditTransaction] = useState({
    id: "",
    fund_id: "",
    amount: "",
    fee_percentage: "0",
    description: "",
    cashier_name: "",
  })

  // Estados para formularios
  const [newFund, setNewFund] = useState({
    initial_amount: "",
    description: "",
  })

  const [newTransaction, setNewTransaction] = useState({
    fund_id: "",
    amount: "",
    transaction_type: "advance", // Solo avances
    fee_percentage: "0",
    description: "",
    cashier_name: "",
  })

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchFunds()
    fetchTransactions()
  }, [])

  // Función para obtener fondos
  const fetchFunds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("cash_advance_fund")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setFunds(data || [])
    } catch (error) {
      console.error("Error fetching funds:", error)
      setError("Error al cargar los fondos: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener transacciones
  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("cash_advance_transactions")
        .select(`
          *,
          cash_advance_fund (
            description
          )
        `)
        .eq("transaction_type", "advance") // Solo obtener avances
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      // Asegurar que los registros antiguos tengan valores para los nuevos campos
      const processedData = data.map((transaction) => ({
        ...transaction,
        fee_percentage: transaction.fee_percentage || 0,
        fee_amount: transaction.fee_amount || 0,
        final_amount: transaction.final_amount || transaction.amount,
      }))

      setTransactions(processedData || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Error al cargar las transacciones: " + error.message)
    }
  }

  // Función para crear nuevo fondo
  const createFund = async () => {
    try {
      if (!newFund.initial_amount || Number.parseFloat(newFund.initial_amount) <= 0) {
        setError("El monto inicial debe ser mayor que 0")
        return
      }

      setLoading(true)
      const amount = Number.parseFloat(newFund.initial_amount)

      const { data, error } = await supabase.from("cash_advance_fund").insert([
        {
          initial_amount: amount,
          current_balance: amount,
          description: newFund.description || "Fondo de avance de efectivo",
        },
      ])

      if (error) throw error

      setSuccess("Fondo creado exitosamente")
      setFundDialogOpen(false)
      setNewFund({ initial_amount: "", description: "" })
      fetchFunds()
    } catch (error) {
      console.error("Error creating fund:", error)
      setError("Error al crear el fondo: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para establecer el monto máximo disponible del fondo
  const setMaxAmount = () => {
    if (!newTransaction.fund_id || !funds.length) return

    const selectedFund = funds.find((f) => f.id === newTransaction.fund_id)
    if (!selectedFund) return

    // Para avances, el monto máximo es el balance completo del fondo
    setNewTransaction({
      ...newTransaction,
      amount: selectedFund.current_balance.toFixed(2),
    })
  }

  // Función para mostrar el diálogo de confirmación
  const showConfirmationDialog = () => {
    try {
      if (!newTransaction.fund_id) {
        setError("Debe seleccionar un fondo")
        return
      }

      if (!newTransaction.amount || Number.parseFloat(newTransaction.amount) <= 0) {
        setError("El monto debe ser mayor que 0")
        return
      }

      if (
        Number.parseFloat(newTransaction.fee_percentage) < 0 ||
        Number.parseFloat(newTransaction.fee_percentage) > 100
      ) {
        setError("El porcentaje debe estar entre 0 y 100")
        return
      }

      const amount = Number.parseFloat(newTransaction.amount)
      const feePercentage = Number.parseFloat(newTransaction.fee_percentage)

      // Para avances: la comisión es ganancia adicional, no se descuenta del fondo
      const feeAmount = amount * (feePercentage / 100)
      const totalToCharge = amount + feeAmount // Lo que se cobra al cliente
      const amountFromFund = amount // Lo que se descuenta del fondo

      // Verificar si hay suficiente balance en el fondo
      const fund = funds.find((f) => f.id === newTransaction.fund_id)
      if (fund && fund.current_balance < amount) {
        setError("No hay suficiente balance en el fondo para este avance")
        return
      }

      const selectedFund = funds.find((f) => f.id === newTransaction.fund_id)
      const remainingBalance = selectedFund.current_balance - amount

      setTransactionPreview({
        ...newTransaction,
        amount,
        feePercentage,
        feeAmount,
        totalToCharge, // Lo que se cobra al cliente
        amountFromFund, // Lo que se descuenta del fondo
        selectedFund,
        remainingBalance,
        currentDate: new Date(),
      })

      setConfirmDialogOpen(true)
    } catch (error) {
      setError("Error al procesar los datos: " + error.message)
    }
  }

  // Función para crear nueva transacción (después de la confirmación)
  const createTransaction = async () => {
    try {
      setLoading(true)
      setConfirmDialogOpen(false)

      const transactionData = {
        fund_id: transactionPreview.fund_id,
        amount: transactionPreview.amount, // Monto del avance
        fee_percentage: transactionPreview.feePercentage,
        fee_amount: transactionPreview.feeAmount, // Comisión (ganancia)
        final_amount: transactionPreview.totalToCharge, // Total que se cobra al cliente
        transaction_type: "advance", // Siempre avance
        description: transactionPreview.description || null,
        cashier_name: transactionPreview.cashier_name || "Sistema",
      }

      const { data, error } = await supabase.from("cash_advance_transactions").insert([transactionData])

      if (error) throw error

      // Verificar si el fondo llegó a 0 y desactivarlo automáticamente
      if (transactionPreview.remainingBalance <= 0) {
        const { error: updateError } = await supabase
          .from("cash_advance_fund")
          .update({ is_active: false })
          .eq("id", transactionPreview.fund_id)

        if (updateError) {
          console.error("Error al desactivar fondo automáticamente:", updateError)
          // No lanzamos error aquí para no interrumpir el flujo principal
        }
      }

      // Mensaje de éxito detallado
      const successMessage = `✅ AVANCE REGISTRADO EXITOSAMENTE
    
📋 DETALLES DE LA TRANSACCIÓN:
• Monto del avance: Bs. ${transactionPreview.amount.toFixed(2)}
• Comisión por servicio (${transactionPreview.feePercentage}%): Bs. ${transactionPreview.feeAmount.toFixed(2)}
• TOTAL A COBRAR AL CLIENTE: Bs. ${transactionPreview.totalToCharge.toFixed(2)}
• Descontado del fondo: Bs. ${transactionPreview.amountFromFund.toFixed(2)}
• Balance restante del fondo: Bs. ${transactionPreview.remainingBalance.toFixed(2)}
• Tu ganancia por comisión: Bs. ${transactionPreview.feeAmount.toFixed(2)}
• Fondo: ${transactionPreview.selectedFund.description}
• Cajero: ${transactionPreview.cashier_name || "Sistema"}
• Fecha: ${format(transactionPreview.currentDate, "dd/MM/yyyy HH:mm")}${
        transactionPreview.remainingBalance <= 0 ? "\n\n🔒 FONDO DESACTIVADO AUTOMÁTICAMENTE (Balance: 0)" : ""
      }`

      setSuccess(successMessage)
      setTransactionDialogOpen(false)
      setNewTransaction({
        fund_id: "",
        amount: "",
        transaction_type: "advance",
        fee_percentage: "0",
        description: "",
        cashier_name: "",
      })
      setTransactionPreview(null)
      fetchFunds()
      fetchTransactions()
    } catch (error) {
      console.error("Error creating transaction:", error)
      setError("Error al registrar la transacción: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para abrir el diálogo de edición
  const openEditDialog = (transaction) => {
    setSelectedTransaction(transaction)
    setEditTransaction({
      id: transaction.id,
      fund_id: transaction.fund_id,
      amount: transaction.amount.toString(),
      fee_percentage: (transaction.fee_percentage || 0).toString(),
      description: transaction.description || "",
      cashier_name: transaction.cashier_name || "",
    })
    setEditDialogOpen(true)
  }

  // Función para editar transacción
  const updateTransaction = async () => {
    try {
      if (!editTransaction.amount || Number.parseFloat(editTransaction.amount) <= 0) {
        setError("El monto debe ser mayor que 0")
        return
      }

      if (
        Number.parseFloat(editTransaction.fee_percentage) < 0 ||
        Number.parseFloat(editTransaction.fee_percentage) > 100
      ) {
        setError("El porcentaje debe estar entre 0 y 100")
        return
      }

      setLoading(true)

      const amount = Number.parseFloat(editTransaction.amount)
      const feePercentage = Number.parseFloat(editTransaction.fee_percentage)
      const feeAmount = amount * (feePercentage / 100)
      const finalAmount = amount + feeAmount

      const updateData = {
        amount,
        fee_percentage: feePercentage,
        fee_amount: feeAmount,
        final_amount: finalAmount,
        description: editTransaction.description || null,
        cashier_name: editTransaction.cashier_name || "Sistema",
      }

      const { error } = await supabase.from("cash_advance_transactions").update(updateData).eq("id", editTransaction.id)

      if (error) throw error

      setSuccess("Transacción actualizada exitosamente")
      setEditDialogOpen(false)
      setSelectedTransaction(null)
      setEditTransaction({
        id: "",
        fund_id: "",
        amount: "",
        fee_percentage: "0",
        description: "",
        cashier_name: "",
      })
      fetchTransactions()
      fetchFunds() // Refrescar fondos para actualizar balances
    } catch (error) {
      console.error("Error updating transaction:", error)
      setError("Error al actualizar la transacción: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para abrir el diálogo de eliminación
  const openDeleteDialog = (transaction) => {
    setSelectedTransaction(transaction)
    setDeleteDialogOpen(true)
  }

  // Función para eliminar transacción
  const deleteTransaction = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.from("cash_advance_transactions").delete().eq("id", selectedTransaction.id)

      if (error) throw error

      setSuccess("Transacción eliminada exitosamente")
      setDeleteDialogOpen(false)
      setSelectedTransaction(null)
      fetchTransactions()
      fetchFunds() // Refrescar fondos para actualizar balances
    } catch (error) {
      console.error("Error deleting transaction:", error)
      setError("Error al eliminar la transacción: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para desactivar un fondo
  const deactivateFund = async (fundId) => {
    try {
      setLoading(true)
      const { error } = await supabase.from("cash_advance_fund").update({ is_active: false }).eq("id", fundId)

      if (error) throw error

      setSuccess("Fondo desactivado exitosamente")
      fetchFunds()
    } catch (error) {
      console.error("Error deactivating fund:", error)
      setError("Error al desactivar el fondo: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas (solo avances)
  const totalFunds = funds.reduce((sum, fund) => sum + (fund.is_active ? fund.current_balance : 0), 0)
  const totalAdvances = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCommissions = transactions.reduce((sum, t) => sum + (t.fee_amount || 0), 0)

  return (
    <>
      <Navbar open={open} setOpen={setOpen} />
      <Container sx={{ mt: { xs: 8, sm: 0 } }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: "2rem", fontWeight: 600 }}>
          Gestión de Avance de Efectivo
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ backgroundColor: "#e3f2fd", boxShadow: 3, borderRadius: "12px" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccountBalanceWalletIcon sx={{ color: "#1976d2", mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Balance Total Fondos
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold" }}>
                  Bs. {totalFunds.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ backgroundColor: "#ffebee", boxShadow: 3, borderRadius: "12px" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TrendingDownIcon sx={{ color: "#d32f2f", mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Avances
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                  Bs. {totalAdvances.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ backgroundColor: "#e8f5e8", boxShadow: 3, borderRadius: "12px" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccountBalanceWalletIcon sx={{ color: "#2e7d32", mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Ganancia Comisiones
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: "#2e7d32", fontWeight: "bold" }}>
                  Bs. {totalCommissions.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ mb: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFundDialogOpen(true)}
            sx={{ backgroundColor: "#1976d2" }}
          >
            Crear Nuevo Fondo
          </Button>
          <Button
            variant="contained"
            startIcon={<AccountBalanceWalletIcon />}
            onClick={() => setTransactionDialogOpen(true)}
            sx={{ backgroundColor: "#2e7d32" }}
            disabled={funds.filter((f) => f.is_active).length === 0}
          >
            Nuevo Avance
          </Button>
        </Box>

        {/* Lista de fondos */}
        <Card sx={{ mb: 4, boxShadow: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: "#1976d2", fontWeight: 500 }}>
              Fondos de Avance de Efectivo
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Monto Inicial</TableCell>
                    <TableCell>Balance Actual</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {funds.map((fund) => (
                    <TableRow key={fund.id}>
                      <TableCell>{fund.description}</TableCell>
                      <TableCell>Bs. {fund.initial_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: fund.current_balance < fund.initial_amount * 0.2 ? "#d32f2f" : "#2e7d32",
                            fontWeight: "bold",
                          }}
                        >
                          Bs. {fund.current_balance.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fund.is_active ? "Activo" : "Inactivo"}
                          color={fund.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{format(new Date(fund.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        {fund.is_active && (
                          <Button size="small" color="error" onClick={() => deactivateFund(fund.id)} disabled={loading}>
                            Desactivar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {funds.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                        No hay fondos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Historial de transacciones */}
        <Card sx={{ boxShadow: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: "#1976d2", fontWeight: 500 }}>
              Historial de Avances (Últimos 50)
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Monto Avance</TableCell>
                  <TableCell>% Comisión</TableCell>
                  <TableCell>Comisión</TableCell>
                  <TableCell>Total Cobrado</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Cajero</TableCell>
                  <TableCell>Fondo</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <Typography sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                        -Bs. {transaction.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{`${transaction.fee_percentage || 0}%`}</TableCell>
                    <TableCell>
                      <Typography sx={{ color: "#2e7d32", fontWeight: "bold" }}>
                        +Bs. {(transaction.fee_amount || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: "#1976d2", fontWeight: "bold" }}>
                        Bs. {(transaction.final_amount || transaction.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.description || "-"}</TableCell>
                    <TableCell>{transaction.cashier_name}</TableCell>
                    <TableCell>{transaction.cash_advance_fund?.description || "N/A"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Editar transacción">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openEditDialog(transaction)}
                            disabled={loading}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar transacción">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(transaction)}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 3 }}>
                      No hay avances registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Diálogo para crear nuevo fondo */}
        <Dialog open={fundDialogOpen} onClose={() => setFundDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Crear Nuevo Fondo de Avance</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Monto Inicial (Bs.)"
              type="number"
              fullWidth
              variant="outlined"
              value={newFund.initial_amount}
              onChange={(e) => setNewFund({ ...newFund, initial_amount: e.target.value })}
              inputProps={{ min: "0", step: "0.01" }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Descripción"
              fullWidth
              variant="outlined"
              value={newFund.description}
              onChange={(e) => setNewFund({ ...newFund, description: e.target.value })}
              placeholder="Descripción del fondo (opcional)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFundDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createFund} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Crear Fondo"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para nuevo avance */}
        <Dialog open={transactionDialogOpen} onClose={() => setTransactionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Nuevo Avance de Efectivo</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Fondo</InputLabel>
              <Select
                value={newTransaction.fund_id}
                label="Fondo"
                onChange={(e) => setNewTransaction({ ...newTransaction, fund_id: e.target.value })}
              >
                {funds
                  .filter((fund) => fund.is_active) // Solo fondos activos
                  .map((fund) => (
                    <MenuItem key={fund.id} value={fund.id}>
                      {fund.description} - Balance: Bs. {fund.current_balance.toFixed(2)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Tipo de transacción fijo como "advance" */}
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Tipo de Transacción</InputLabel>
              <Select value="advance" label="Tipo de Transacción" disabled={true}>
                <MenuItem value="advance">Avance de Efectivo</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TextField
                margin="dense"
                label="Monto del Avance (Bs.)"
                type="number"
                fullWidth
                variant="outlined"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                inputProps={{ min: "0", step: "0.01" }}
                sx={{ mr: 1 }}
                helperText="Monto que se descuenta del fondo"
              />
              {newTransaction.fund_id && (
                <Tooltip title="Usar todo el balance disponible del fondo">
                  <Button variant="outlined" onClick={setMaxAmount} sx={{ height: "56px", whiteSpace: "nowrap" }}>
                    Usar Todo
                  </Button>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TextField
                margin="dense"
                label="Porcentaje de comisión (%)"
                type="number"
                fullWidth
                variant="outlined"
                value={newTransaction.fee_percentage}
                onChange={(e) => setNewTransaction({ ...newTransaction, fee_percentage: e.target.value })}
                inputProps={{ min: "0", max: "100", step: "0.1" }}
                helperText="Tu ganancia por el servicio de avance"
              />
              <Tooltip title="La comisión es tu ganancia por el servicio. Se cobra al cliente pero NO se descuenta del fondo.">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <TextField
              margin="dense"
              label="Cajero"
              fullWidth
              variant="outlined"
              value={newTransaction.cashier_name}
              onChange={(e) => setNewTransaction({ ...newTransaction, cashier_name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Descripción"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              placeholder="Descripción del avance (opcional)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTransactionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={showConfirmationDialog} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Continuar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación de avance */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: "#f5f5f5", textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
              🏦 CONFIRMAR AVANCE DE EFECTIVO
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {transactionPreview && (
              <Box>
                <Card sx={{ mb: 3, backgroundColor: "#e3f2fd", border: "2px solid #1976d2" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, textAlign: "center" }}>
                      📋 RESUMEN DEL AVANCE
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>📅 Fecha:</strong> {format(transactionPreview.currentDate, "dd/MM/yyyy HH:mm")}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>👤 Cajero:</strong> {transactionPreview.cashier_name || "Sistema"}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>🏦 Fondo:</strong> {transactionPreview.selectedFund.description}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>💵 Monto del avance:</strong> Bs. {transactionPreview.amount.toFixed(2)}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>📊 Comisión ({transactionPreview.feePercentage}%):</strong> Bs.{" "}
                          {transactionPreview.feeAmount.toFixed(2)}
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 1, color: "#1976d2", fontWeight: "bold" }}>
                          <strong>💰 TOTAL A COBRAR:</strong> Bs. {transactionPreview.totalToCharge.toFixed(2)}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>🏦 Balance actual del fondo:</strong> Bs.{" "}
                          {transactionPreview.selectedFund.current_balance.toFixed(2)}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 1,
                            color:
                              transactionPreview.remainingBalance < transactionPreview.selectedFund.initial_amount * 0.2
                                ? "#d32f2f"
                                : "#2e7d32",
                            fontWeight: "bold",
                          }}
                        >
                          <strong>💳 Balance después:</strong> Bs. {transactionPreview.remainingBalance.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {transactionPreview.description && (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                        <Typography variant="body2">
                          <strong>📝 Descripción:</strong> {transactionPreview.description}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {transactionPreview.remainingBalance <= 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    🔒 <strong>Información:</strong> Este avance dejará el fondo en 0 y se desactivará automáticamente.
                  </Alert>
                )}

                {transactionPreview.remainingBalance < transactionPreview.selectedFund.initial_amount * 0.2 &&
                  transactionPreview.remainingBalance > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      ⚠️ <strong>Advertencia:</strong> El balance del fondo quedará por debajo del 20% del monto inicial
                      después de esta transacción.
                    </Alert>
                  )}

                <Card sx={{ backgroundColor: "#fff3e0", border: "1px solid #f57c00" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#f57c00", textAlign: "center" }}>
                      💡 INFORMACIÓN DEL NEGOCIO
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
                      • <strong>Del fondo se descuentan:</strong> Bs. {transactionPreview.amountFromFund.toFixed(2)}
                      <br />• <strong>Al cliente se le cobra:</strong> Bs. {transactionPreview.totalToCharge.toFixed(2)}
                      <br />• <strong>Tu ganancia por comisión:</strong> Bs. {transactionPreview.feeAmount.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
            <Button
              onClick={() => setConfirmDialogOpen(false)}
              variant="outlined"
              size="large"
              sx={{ minWidth: "120px" }}
            >
              ❌ Cancelar
            </Button>
            <Button
              onClick={createTransaction}
              variant="contained"
              disabled={loading}
              size="large"
              sx={{
                minWidth: "120px",
                backgroundColor: "#d32f2f",
                "&:hover": {
                  backgroundColor: "#b71c1c",
                },
              }}
            >
              {loading ? <CircularProgress size={20} /> : "✅ Confirmar Avance"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para editar transacción */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Avance de Efectivo</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Nota:</strong> Al editar esta transacción, los balances de los fondos se recalcularán
              automáticamente.
            </Alert>

            <TextField
              margin="dense"
              label="Monto del Avance (Bs.)"
              type="number"
              fullWidth
              variant="outlined"
              value={editTransaction.amount}
              onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
              inputProps={{ min: "0", step: "0.01" }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Porcentaje de comisión (%)"
              type="number"
              fullWidth
              variant="outlined"
              value={editTransaction.fee_percentage}
              onChange={(e) => setEditTransaction({ ...editTransaction, fee_percentage: e.target.value })}
              inputProps={{ min: "0", max: "100", step: "0.1" }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Cajero"
              fullWidth
              variant="outlined"
              value={editTransaction.cashier_name}
              onChange={(e) => setEditTransaction({ ...editTransaction, cashier_name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Descripción"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={editTransaction.description}
              onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
              placeholder="Descripción del avance (opcional)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={updateTransaction} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Actualizar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para confirmar eliminación */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>¿Estás seguro de que deseas eliminar esta transacción?</strong>
            </Alert>
            {selectedTransaction && (
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Fecha:</strong> {format(new Date(selectedTransaction.created_at), "dd/MM/yyyy HH:mm")}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Monto:</strong> Bs. {selectedTransaction.amount.toFixed(2)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Comisión:</strong> Bs. {(selectedTransaction.fee_amount || 0).toFixed(2)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Cajero:</strong> {selectedTransaction.cashier_name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Descripción:</strong> {selectedTransaction.description || "Sin descripción"}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Esta acción no se puede deshacer. Los balances de los fondos se recalcularán automáticamente.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={deleteTransaction} variant="contained" color="error" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Eliminar"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  )
}

export default CashAdvanceManager





