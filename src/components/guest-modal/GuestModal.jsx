import { useEffect, useId, useRef, useState } from 'react';
import { confirmGuestByName } from '../../lib/guests';
import { isRsvpOpen } from '../../lib/rsvpStatus';
import { getGuestListStats } from '../../lib/officialGuestList';
import './guest-modal.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function GuestModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done | already-confirmed
  const [error, setError] = useState(null);
  const [closedInfo, setClosedInfo] = useState(null); // null = checking | { allConfirmed: boolean }
  const firstInputRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    setName('');
    setStatus('idle');
    setError(null);
    setClosedInfo(undefined);

    isRsvpOpen()
      .then(async (isOpen) => {
        if (isOpen) {
          setClosedInfo(null);
          return;
        }
        try {
          const stats = await getGuestListStats();
          setClosedInfo({ allConfirmed: stats.total > 0 && stats.confirmed >= stats.total });
        } catch {
          setClosedInfo({ allConfirmed: false });
        }
      })
      .catch(() => setClosedInfo(null));

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
      await confirmGuestByName(cleanName);
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      if (err.code === 'ALREADY_CONFIRMED') {
        setStatus('already-confirmed');
      } else if (err.code === 'NOT_FOUND') {
        setError('Pessoa não encontrada 😕');
      } else if (err.code === 'CLOSED') {
        setClosedInfo({ allConfirmed: false });
      } else {
        setError(err.message || 'Não foi possível confirmar agora. Tente novamente.');
      }
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
            <p id={titleId} className="guest-modal-success-title">Presença confirmada! ❤️</p>
            <p className="guest-modal-success-note">Aguardamos você!</p>
            <button type="button" className="guest-modal-submit" onClick={onClose}>
              fechar
            </button>
          </div>
        ) : status === 'already-confirmed' ? (
          <div className="guest-modal-success">
            <span className="guest-modal-success-ornament" aria-hidden="true">&#10047;</span>
            <p id={titleId} className="guest-modal-success-title">
              Sua presença já está confirmada, te aguardamos lá! 🤵👰
            </p>
            <button type="button" className="guest-modal-submit" onClick={onClose}>
              fechar
            </button>
          </div>
        ) : closedInfo ? (
          <div className="guest-modal-success">
            <span className="guest-modal-success-ornament" aria-hidden="true">&#10047;</span>
            <p id={titleId} className="guest-modal-success-title">
              {closedInfo.allConfirmed ? 'Todos já confirmaram sua presença!' : 'Confirmações encerradas'}
            </p>
            <p className="guest-modal-success-note">
              {closedInfo.allConfirmed
                ? 'Nos vemos no grande dia! 🤵👰❤️'
                : 'A lista de confirmação de presença já está fechada. Qualquer dúvida, fale direto com a gente.'}
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
              disabled={status === 'submitting' || closedInfo === undefined}
            >
              {status === 'submitting' ? 'confirmando…' : 'confirmar presença'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
