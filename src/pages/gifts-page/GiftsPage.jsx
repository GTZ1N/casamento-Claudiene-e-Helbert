import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gifts } from '../../data/gifts';
import GiftCard from '../../components/gifts/GiftCard';
import { createGiftPaymentLink } from '../../lib/mercadopago';
import './gifts-page.css';

export default function GiftsPage() {
  const [giverName, setGiverName] = useState('');
  const [giverMessage, setGiverMessage] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [errorId, setErrorId] = useState(null);
  const [nameError, setNameError] = useState(false);
  const [shake, setShake] = useState(false);
  const nameInputRef = useRef(null);

  const handleGift = async (gift) => {
    const cleanName = giverName.trim();
    if (!cleanName) {
      setNameError(true);
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus();
      // Reinicia a animação mesmo em tentativas seguidas (re-adicionar a
      // mesma classe não reinicia keyframes já rodando) removendo e
      // reaplicando no próximo frame.
      setShake(false);
      requestAnimationFrame(() => setShake(true));
      return;
    }
    setNameError(false);
    setErrorId(null);
    setPayingId(gift.id);
    try {
      const initPoint = await createGiftPaymentLink(gift.id, cleanName, giverMessage.trim());
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

        <div className="gifts-page-giver">
          <input
            ref={nameInputRef}
            type="text"
            className={`gifts-page-giver-input${nameError ? ' gifts-page-giver-input--error' : ''}`}
            placeholder="Seu nome"
            value={giverName}
            onChange={(e) => {
              setGiverName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
          />
          {nameError && (
            <p
              className={`gifts-page-giver-error${shake ? ' gifts-page-giver-error--shake' : ''}`}
              onAnimationEnd={() => setShake(false)}
            >
              Preencha seu nome antes de escolher um presente.
            </p>
          )}

          <textarea
            className="gifts-page-giver-input gifts-page-giver-message"
            placeholder="Deixe uma mensagem pro casal"
            value={giverMessage}
            onChange={(e) => setGiverMessage(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
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
