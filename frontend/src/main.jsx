import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    background: { default: '#f5f7fb' },
    text: { primary: '#182230' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minWidth: 320,
          minHeight: '100vh',
          background: 'radial-gradient(circle at 15% 10%, rgba(37, 99, 235, .11), transparent 30rem), radial-gradient(circle at 90% 90%, rgba(124, 58, 237, .08), transparent 28rem), #f5f7fb',
        },
      },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 20, boxShadow: '0 8px 30px rgba(24, 34, 48, .08)' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
