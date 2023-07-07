import { createTheme } from '@mui/material/styles';

export const KSUTheme = createTheme({
  typography: {
    fontFamily: ['"Courier New"', 'courier', 'monospace'].join(' ,')
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          margin: '10px',
          paddingTop: '20px',
          boxShadow: 'none',
          //boxShadow: '0px 1px 3px 3px rgba(0, 0, 0, 0.1)'
          borderRadius: '0px'
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
