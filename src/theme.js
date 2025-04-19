import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#63a4ff',
      dark: '#004ba0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4569',
      dark: '#9a0036',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#718096',
    },
    success: {
      main: '#388e3c',
      light: '#e8f5e9',
    },
    warning: {
      main: '#d32f2f',
      light: '#ffebee',
    },
    info: {
      main: '#0288d1',
      light: '#e0f7fa',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#2d3748',
    },
    h2: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#2d3748',
    },
    h6: {
      fontSize: '0.9rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      color: '#4a5568',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            transform: 'scale(1.02)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
          '&:hover': {
            background: 'linear-gradient(90deg, #1565c0, #2196f3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 8px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          padding: '12px',
        },
        head: {
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          '&:nth-of-type(even)': {
            backgroundColor: '#f9f9f9',
          },
          '&:hover': {
            backgroundColor: '#e3f2fd',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;