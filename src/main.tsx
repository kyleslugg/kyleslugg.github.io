import React from 'react';
import ReactDOM from 'react-dom/client';

import './styles/index.scss';
//import 'latex.css';

import CssBaseline from '@mui/material/CssBaseline';

import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { KSUTheme } from './styles/MUITheme.ts';
import Content from './content.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={KSUTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Content />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
