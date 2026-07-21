import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Monogram from '../components/ui/Monogram';
import GuestModal from '../components/guest-modal/GuestModal';
import './footer-section.css';

export default function FooterSection() {
  const ref = useScrollReveal({ y: 18, stagger: 0.15, start: 'top 85%' });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <footer className="section footer-section" id="rsvp" ref={ref}>
      <Monogram size="sm" />
      <p className="footer-note">Com carinho, esperamos por vocês.</p>
      <p className="footer-names">Claudiene &amp; Helbert</p>
      <button type="button" className="footer-rsvp" onClick={() => setModalOpen(true)}>
        confirmar presença
      </button>
      <GuestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </footer>
  );
}
