import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Homepage from './pages/Homepage.tsx';
import './styles/index.scss';
import Header from './components/header.tsx';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import GitHubIcon from '@mui/icons-material/GitHub';
import { ThemeProvider } from '@mui/material/styles';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { KSUTheme } from './styles/MUITheme.ts';
import About from './pages/About.tsx';
import Contact from './pages/Contact.tsx';

const sections = [
  { title: 'Home', url: '/' },
  { title: 'About', url: '/about' },
  { title: 'Work', url: '/work' },
  { title: 'Contact', url: '/contact' }
];

const Content = () => {
  const [url, setUrl] = useState<string>('');

  return (
    <Container maxWidth="lg">
      <Header
        sections={sections}
        title="Kyle Slugg-Urbino | Software + Cities"
      />
      <Routes>
        <Route index path="/" element={<Homepage />} />
        <Route index path="/about" element={<About />} />
        <Route index path="/contact" element={<Contact />} />
      </Routes>
    </Container>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={KSUTheme}>
        <CssBaseline />
        <Content />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
