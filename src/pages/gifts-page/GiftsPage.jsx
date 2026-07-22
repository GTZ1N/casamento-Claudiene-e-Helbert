import { useState } from 'react';
import { Link } from 'react-router-dom';
import { gifts } from '../../data/gifts';
import GiftCard from '../../components/gifts/GiftCard';
import { createGiftPaymentLink } from '../../lib/mercadopago';
import './gifts-page.css';

export default function GiftsPage() {
  const [payingId, setPayingId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  const handleGift = async (gift) => {
    setErrorId(null);
    setPayingId(gift.id);
    try {
      const initPoint = await createGiftPaymentLink(gift.id);
      window.location.href = initPoint;
    } catch {
      setErrorId(gift.id);
      setPayingId(null);
    }
  };

  return (
    <main className="gifts-page">
      <div className="gifts-page-header">
        <Link to="/#presentes" className="gifts-page-back">
          ← voltar ao convite
        </Link>
        <p className="section-eyebrow">para nos presentear</p>
        <h1 className="section-title">Lista de presentes</h1>
        <span className="section-divider" />
        <p className="gifts-page-intro">
          Escolha um item e presenteie via Pix. O valor vai direto pra gente, sem burocracia.
        </p>
      </div>

      <div className="gifts-page-grid">
        {gifts.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            onGift={handleGift}
            loading={payingId === gift.id}
            error={errorId === gift.id}
          />
        ))}
      </div>
    </main>
  );
}
