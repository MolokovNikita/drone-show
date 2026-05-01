import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#50c8ff',
      light: '#82d8ff',
      dark: '#0ea5e9',
    },
    secondary: {
      main: '#6b8fff',
      light: '#a0b4ff',
      dark: '#3d5ccc',
    },
    background: {
      default: '#060912',
      paper: '#0b1120',
    },
    text: {
      primary: 'rgba(255,255,255,0.92)',
      secondary: 'rgba(255,255,255,0.5)',
      disabled: 'rgba(255,255,255,0.28)',
    },
    error: { main: '#dc5050' },
    warning: { main: '#e6b450' },
    info: { main: '#6b8fff' },
    success: { main: '#73dc82' },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#060912',
          minHeight: '100vh',
          fontFamily: "'Space Grotesk', sans-serif",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.25s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '9px 20px',
          fontWeight: 600,
          textTransform: 'none',
          fontFamily: "'Space Grotesk', sans-serif",
          transition: 'all 0.2s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #50c8ff, #6b8fff)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(80,200,255,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #82d8ff, #8fa8ff)',
            boxShadow: '0 6px 24px rgba(80,200,255,0.5)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
          '&:hover': {
            border: '1px solid rgba(80,200,255,0.4)',
            background: 'rgba(80,200,255,0.08)',
            color: '#50c8ff',
          },
        },
        text: {
          color: 'rgba(255,255,255,0.7)',
          '&:hover': { background: 'rgba(255,255,255,0.06)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            fontFamily: "'Space Grotesk', sans-serif",
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&.Mui-focused': {
              background: 'rgba(255,255,255,0.06)',
              boxShadow: '0 0 0 3px rgba(80,200,255,0.12)',
              '& fieldset': { borderColor: 'rgba(80,200,255,0.6)', borderWidth: '1px' },
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Space Grotesk', sans-serif",
            '&.Mui-focused': { color: '#50c8ff' },
          },
          '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.92)', fontFamily: "'Space Grotesk', sans-serif" },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { color: 'rgba(255,255,255,0.92)', fontFamily: "'Space Grotesk', sans-serif" },
        icon: { color: 'rgba(255,255,255,0.4)' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "'Space Grotesk', sans-serif",
          '&:hover': { background: 'rgba(80,200,255,0.08)' },
          '&.Mui-selected': {
            background: 'rgba(80,200,255,0.12)',
            '&:hover': { background: 'rgba(80,200,255,0.16)' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11,
          letterSpacing: '0.03em',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.92)',
          fontFamily: "'Space Grotesk', sans-serif",
        },
        head: {
          fontWeight: 600,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.28)',
          background: 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(255,255,255,0.03)' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(6,9,18,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #0b1120 0%, #060912 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            background: 'rgba(80,200,255,0.12)',
            color: '#50c8ff',
            '&:hover': { background: 'rgba(80,200,255,0.16)' },
            '& .MuiListItemIcon-root': { color: '#50c8ff' },
          },
          '&:hover': { background: 'rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          background: '#0f1825',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          color: 'rgba(255,255,255,0.92)',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.07)' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          color: 'rgba(255,255,255,0.5)',
          '&:hover': { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'Space Grotesk', sans-serif",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          textTransform: 'none',
          color: 'rgba(255,255,255,0.4)',
          '&.Mui-selected': { color: '#50c8ff' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#50c8ff' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontFamily: "'Space Grotesk', sans-serif",
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: { fontFamily: "'Space Grotesk', sans-serif" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: "'Space Grotesk', sans-serif",
          color: 'rgba(255,255,255,0.4)',
          '&.Mui-focused': { color: '#50c8ff' },
        },
      },
    },
  },
});

export default theme;
