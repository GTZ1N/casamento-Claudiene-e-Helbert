import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import FlipBook from './components/flipbook/FlipBook';
import PhotoMoment from './components/photo-moment/PhotoMoment';
import HeroSection from './sections/HeroSection';
import DetailsSection from './sections/DetailsSection';
import VerseSection from './sections/VerseSection';
import GallerySection from './sections/GallerySection';
import DressCodeSection from './sections/DressCodeSection';
import GuestManualSection from './sections/GuestManualSection';
import GiftsSection from './sections/GiftsSection';
import ConfirmedGuestsSection from './sections/ConfirmedGuestsSection';
import FooterSection from './sections/FooterSection';
import GiftsPage from './pages/gifts-page/GiftsPage';
import SoundToggle from './components/sound-toggle/SoundToggle';
import { useLenis } from './hooks/useLenis';
import { scrollToId } from './lib/lenis-instance';
import './styles/sections.css';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const timer = setTimeout(() => scrollToId(id), 300);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return null;
}

function HomePage() {
  useLenis();

  return (
    <main>
      <FlipBook />
      <HeroSection />
      <DetailsSection />
      <PhotoMoment
        src="/gallery/gallery-04.jpg"
        alt="Claudiene e Helbert abraçados perto dos trilhos"
        quote="Cada passo nos trouxe até aqui."
        fit="contain"
      />
      <VerseSection />
      <GallerySection />
      <DressCodeSection />
      <PhotoMoment
        src="/gallery/gallery-06.jpg"
        alt="Claudiene e Helbert se beijando na trilha"
        quote="O amor transforma os pequenos momentos em eternidade."
      />
      <GuestManualSection />
      <PhotoMoment
        src="/gallery/gallery-23.jpg"
        alt="Claudiene e Helbert de mãos dadas sobre os trilhos"
        quote="Nosso para sempre começa agora."
        fit="contain"
      />
      <GiftsSection />
      <ConfirmedGuestsSection />
      <FooterSection />
    </main>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <SoundToggle src="/audio/still-the-one.mp3" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/presentes" element={<GiftsPage />} />
      </Routes>
    </>
  );
}

export default App;
