import { createTheme } from '@mui/material/styles';

export const KSUTheme = createTheme({
  typography: {
    fontFamily: ['"Courier New"', 'courier', 'monospace'].join(' ,')
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          margin: '0, auto',
          boxShadow: 'none'
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          display: 'flex',
          flexWrap: 'wrap',
          padding: '0px',
          margin: '0px'
        }
      }
    }
  }
});
