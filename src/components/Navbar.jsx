"use client"

import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Toolbar,
  AppBar,
  Collapse,
} from "@mui/material"
import { supabase } from "../supabase"
import HomeIcon from "@mui/icons-material/Home"
import StoreIcon from "@mui/icons-material/Store"
import PointOfSaleIcon from "@mui/icons-material/PointOfSale"
import AssessmentIcon from "@mui/icons-material/Assessment"
import SettingsIcon from "@mui/icons-material/Settings"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import MenuIcon from "@mui/icons-material/Menu"
import LogoutIcon from "@mui/icons-material/Logout"
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import ExpandLess from "@mui/icons-material/ExpandLess"
import ExpandMore from "@mui/icons-material/ExpandMore"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"
import MoneyIcon from "@mui/icons-material/Money"

const drawerWidth = 240

function Navbar({ open, setOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [userName, setUserName] = useState("Usuario")
  const [cashAdvanceOpen, setCashAdvanceOpen] = useState(false)

  // Verificar si la ruta actual está dentro del módulo de avance de efectivo
  useEffect(() => {
    if (location.pathname.includes("/avance")) {
      setCashAdvanceOpen(true)
    }
  }, [location.pathname])

  // Ajustar el estado inicial de 'open' según el tamaño del dispositivo
  useEffect(() => {
    if (isMobile) {
      setOpen(false) // Cerrado por defecto en dispositivos pequeños
    } else {
      setOpen(true) // Abierto por defecto en dispositivos grandes
    }
  }, [isMobile, setOpen])

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error("Error getting user:", authError)
          setUserName("Usuario")
          return
        }

        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("first_name")
          .eq("id", user.id)
          .single()

        if (userDataError || !userData) {
          console.error("Error fetching user data:", userDataError)
          setUserName("Usuario")
          return
        }

        setUserName(userData.first_name || "Usuario")
      } catch (error) {
        console.error("Unexpected error fetching user name:", error)
        setUserName("Usuario")
      }
    }

    fetchUserName()
  }, [])

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  const handleCashAdvanceClick = () => {
    setCashAdvanceOpen(!cashAdvanceOpen)
  }

  const menuItems = [
    { text: "Inicio", icon: <HomeIcon />, path: "/" },
    { text: "Inventario", icon: <StoreIcon />, path: "/inventory" },
    { text: "Ventas", icon: <PointOfSaleIcon />, path: "/pos" },
    { text: "Reportes", icon: <AssessmentIcon />, path: "/reports" },
    {
      text: "Avance de Efectivo",
      icon: <AccountBalanceWalletIcon />,
      submenu: true,
      open: cashAdvanceOpen,
      onClick: handleCashAdvanceClick,
      items: [
        {
          text: "Gestión",
          icon: <MoneyIcon />,
          path: "/avance/gestion",
        },
        // {
        //   text: "Reportes",
        //   icon: <ReceiptLongIcon />,
        //   path: "/avance/reportes",
        // },
      ],
    },
    { text: "Configuración", icon: <SettingsIcon />, path: "/settings" },
    {
      text: "Cerrar Sesión",
      icon: <LogoutIcon />,
      action: async () => {
        await supabase.auth.signOut()
        navigate("/login")
        if (isMobile) handleDrawerClose()
      },
    },
  ]

  // Función para determinar si un elemento del menú está activo
  const isActive = (item) => {
    if (item.path) {
      return location.pathname === item.path
    }
    if (item.submenu && item.items) {
      return item.items.some((subItem) => location.pathname === subItem.path)
    }
    return false
  }

  return (
    <>
      {/* AppBar para mostrar el botón de menú en dispositivos pequeños */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: "#1a2526",
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, display: open ? "none" : "block" }}
            >
              <MenuIcon sx={{ color: "#ffffff" }} />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, color: "#ffffff" }}>
              {menuItems.find((item) => item.path === location.pathname)?.text || "Dxtodito C.A"}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={handleDrawerClose}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#1a2526",
            borderRight: "none",
            transition: "width 0.3s ease-in-out",
            color: "#ffffff",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        {/* Ajustar el espacio superior en dispositivos móviles para que el contenido del drawer no quede debajo del AppBar */}
        {isMobile && <Toolbar />}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 3,
            backgroundColor: "#263536",
            borderBottom: "1px solid #ffffff1a",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#ffffff", mb: 1 }}>
            Dxtodito C.A
          </Typography>
          <Typography variant="body2" sx={{ color: "#ffffff99" }}>
            Bienvenido, {userName}
          </Typography>
          {open && (
            <IconButton
              onClick={handleDrawerClose}
              sx={{
                position: "absolute",
                right: 8,
                top: isMobile ? 72 : 16, // Ajustar posición en móviles
                backgroundColor: "#ffffff1a",
                "&:hover": { backgroundColor: "#ffffff33" },
              }}
            >
              <ChevronLeftIcon sx={{ color: "#ffffff" }} />
            </IconButton>
          )}
        </Box>
        <Divider sx={{ backgroundColor: "#ffffff1a", my: 1 }} />

        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.text}>
              <ListItem
                component="button"
                onClick={() => {
                  if (item.action) {
                    item.action()
                  } else if (item.submenu) {
                    item.onClick()
                  } else {
                    navigate(item.path)
                    if (isMobile) handleDrawerClose()
                  }
                }}
                sx={{
                  py: 1,
                  px: 1.5,
                  my: 0.5,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "#263536",
                    borderLeft: "4px solid #42a5f5",
                    transition: "all 0.2s ease-in-out",
                  },
                  backgroundColor: isActive(item) ? "#1976d2" : "transparent",
                  borderLeft: isActive(item) ? "4px solid #42a5f5" : "none",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <ListItemIcon sx={{ color: isActive(item) ? "#ffffff" : "#ffffff99", minWidth: 48 }}>
                  {React.cloneElement(item.icon, { sx: { fontSize: 32 } })}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    color: isActive(item) ? "#ffffff" : "#ffffffcc",
                    "& .MuiTypography-root": { fontSize: "1.1rem", fontWeight: 500 },
                  }}
                />
                {item.submenu && (item.open ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>

              {/* Submenú para Avance de Efectivo */}
              {item.submenu && (
                <Collapse in={item.open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.items.map((subItem) => (
                      <ListItem
                        component="button"
                        key={subItem.text}
                        onClick={() => {
                          navigate(subItem.path)
                          if (isMobile) handleDrawerClose()
                        }}
                        sx={{
                          py: 0.75,
                          px: 1.5,
                          pl: 4,
                          my: 0.25,
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: "#263536",
                            borderLeft: "4px solid #42a5f5",
                            transition: "all 0.2s ease-in-out",
                          },
                          backgroundColor: location.pathname === subItem.path ? "#1976d2" : "transparent",
                          borderLeft: location.pathname === subItem.path ? "4px solid #42a5f5" : "none",
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <ListItemIcon
                          sx={{ color: location.pathname === subItem.path ? "#ffffff" : "#ffffff99", minWidth: 36 }}
                        >
                          {React.cloneElement(subItem.icon, { sx: { fontSize: 24 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.text}
                          sx={{
                            color: location.pathname === subItem.path ? "#ffffff" : "#ffffffcc",
                            "& .MuiTypography-root": { fontSize: "0.95rem", fontWeight: 500 },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ backgroundColor: "#ffffff1a", my: 1 }} />
      </Drawer>
    </>
  )
}

export default Navbar
