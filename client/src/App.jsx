import { Routes, Route } from 'react-router-dom';

import CTA from './components/CTA/CTA';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import Testimonials from './components/Testimonials/Testimonials';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import HowItWorks from './components/HowItWorks/HowItWorks';
import Stats from './components/Stats/Stats';

const LandingPage = () => {
  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
};

export default App;