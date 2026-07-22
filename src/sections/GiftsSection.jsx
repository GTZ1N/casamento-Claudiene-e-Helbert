import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import PixModal from '../components/pix-modal/PixModal';
import './gifts-section.css';

export default function GiftsSection() {
  const ref = useScrollReveal({ targets: '.gifts-reveal', y: 22, stagger: 0.14 });
  const [pixOpen, setPixOpen] = useState(false);

  return (
    <section className="section gifts-section" id="presentes" ref={ref}>
      <div className="section-inner gifts-reveal">
        <p className="section-eyebrow">para nos presentear</p>
        <h2 className="section-title">Lista de presentes</h2>
        <span className="section-divider" />
        <p className="gifts-intro">
          Sua presença já é o nosso maior presente, mas se quiser nos presentear escolha uma
          das formas abaixo.
        </p>

        <div className="gifts-options">
          <button type="button" className="gifts-option-btn" onClick={() => setPixOpen(true)}>
            <span className="gifts-option-title">Presentear via Pix</span>
            <span className="gifts-option-sub">valor livre, direto pra gente</span>
          </button>

          <Link to="/presentes" className="gifts-option-btn gifts-option-btn--outline">
            <span className="gifts-option-title">Presentear com itens da lista</span>
            <span className="gifts-option-sub">escolha um item da nossa lista</span>
          </Link>
        </div>
      </div>

      <PixModal open={pixOpen} onClose={() => setPixOpen(false)} />
    </section>
  );
}
