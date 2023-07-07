import Container from '@mui/material/Container';
import Homepage from './pages/Homepage.tsx';
import Header from './components/header.tsx';
import About from './pages/About.tsx';
import Contact from './pages/Contact.tsx';
import { Routes, Route } from 'react-router-dom';
import Footer from './components/footer.tsx';

const sections = [
  { title: 'Home', url: '/' },
  { title: 'About', url: '/about' },
  { title: 'Work', url: '/work' },
  { title: 'Contact', url: '/contact' }
];

export default function Content() {
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
      <Footer />
    </Container>
  );
}
