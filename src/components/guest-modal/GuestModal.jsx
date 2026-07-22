import { useEffect, useId, useRef, useState } from 'react';
import { addGuests } from '../../lib/guests';
import { isRsvpOpen } from '../../lib/rsvpStatus';
import './guest-modal.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Cada convidado só confirma uma vez neste navegador — depois de confirmar,
// o modal para de mostrar o formulário e passa a exibir só a mensagem de
// sucesso, mesmo em uma nova visita.
const CONFIRMED_STORAGE_KEY = 'ch-guest-confirmed';

function hasAlreadyConfirmed() {
  return localStorage.getItem(CONFIRMED_STORAGE_KEY) === 'true';
}

function markAsConfirmed() {
  localStorage.setItem(CONFIRMED_STORAGE_KEY, 'true');
}

export default function GuestModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState(null);
  const [rsvpOpen, setRsvpOpen] = useState(null); // null = checking | true | false
  const firstInputRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    setName('');
    setStatus(hasAlreadyConfirmed() ? 'done' : 'idle');
    setError(null);
    setRsvpOpen(null);

    isRsvpOpen()
      .then(setRsvpOpen)
      .catch(() => setRsvpOpen(true));

    const focusTimer = setTimeout(() => firstInputRef.current?.focus(), 50);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Preencha seu nome completo.');
      return;
    }

    setStatus('submitting');
    setError(null);
    try {
      const { inserted, duplicates } = await addGuests([cleanName]);
      if (inserted.length === 0 && duplicates.length > 0) {
        setStatus('idle');
        setError('Este nome já consta na lista de convidados confirmados.');
        return;
      }
      markAsConfirmed();
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Não foi possível confirmar agora. Tente novamente.');
    }
  };

  return (
    <div className="guest-modal-backdrop" onMouseDown={onClose}>
      <div
        className="guest-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="guest-modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon />
        </button>

        {status === 'done' ? (
          <div className="guest-modal-success">
            <span className="guest-modal-success-ornament" aria-hidden="true">&#10047;</span>
            <p id={titleId} className="guest-modal-success-title">Presença confirmada!</p>
            <p className="guest-modal-success-note">Aguardamos você!</p>
            <button type="button" className="guest-modal-submit" onClick={onClose}>
              fechar
            </button>
          </div>
        ) : rsvpOpen === false ? (
          <div className="guest-modal-success">
            <span className="guest-modal-success-ornament" aria-hidden="true">&#10047;</span>
            <p id={titleId} className="guest-modal-success-title">Confirmações encerradas</p>
            <p className="guest-modal-success-note">
              A lista de confirmação de presença já está fechada. Qualquer dúvida, fale
              direto com a gente.
            </p>
            <button type="button" className="guest-modal-submit" onClick={onClose}>
              fechar
            </button>
          </div>
        ) : (
          <form className="guest-modal-form" onSubmit={handleSubmit}>
            <p className="section-eyebrow">confirmar presença</p>
            <h2 id={titleId} className="guest-modal-title">Quem vem celebrar com a gente?</h2>

            <div className="guest-modal-fields">
              <div className="guest-modal-field">
                <input
                  ref={firstInputRef}
                  type="text"
                  className="guest-modal-input"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            {error && <p className="guest-modal-error">{error}</p>}

            <button
              type="submit"
              className="guest-modal-submit"
              disabled={status === 'submitting' || rsvpOpen === null}
            >
              {status === 'submitting' ? 'confirmando…' : 'confirmar presença'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
