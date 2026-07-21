import { useEffect, useId, useRef, useState } from 'react';
import { addGuests } from '../../lib/guests';
import './guest-modal.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function GuestModal({ open, onClose }) {
  const [names, setNames] = useState(['']);
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState(null);
  const [duplicateNames, setDuplicateNames] = useState([]);
  const firstInputRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    setNames(['']);
    setStatus('idle');
    setError(null);
    setDuplicateNames([]);
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

  const updateName = (index, value) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addField = () => setNames((prev) => [...prev, '']);

  const removeField = (index) => {
    setNames((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);
    if (cleanNames.length === 0) {
      setError('Preencha ao menos um nome completo.');
      return;
    }

    setStatus('submitting');
    setError(null);
    try {
      const { inserted, duplicates } = await addGuests(cleanNames);
      setDuplicateNames(duplicates);
      if (inserted.length === 0) {
        setStatus('idle');
        setError(
          duplicates.length === 1
            ? 'Este nome já consta na lista de convidados confirmados.'
            : 'Esses nomes já constam na lista de convidados confirmados.',
        );
        return;
      }
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
            <p className="guest-modal-success-note">
              Obrigado por fazer parte desse momento com a gente.
            </p>
            {duplicateNames.length > 0 && (
              <p className="guest-modal-success-note guest-modal-success-note--muted">
                ({duplicateNames.length === 1 ? 'um nome' : `${duplicateNames.length} nomes`} já
                estava{duplicateNames.length === 1 ? '' : 'm'} na lista e não{' '}
                {duplicateNames.length === 1 ? 'foi duplicado' : 'foram duplicados'})
              </p>
            )}
            <button type="button" className="guest-modal-submit" onClick={onClose}>
              fechar
            </button>
          </div>
        ) : (
          <form className="guest-modal-form" onSubmit={handleSubmit}>
            <p className="section-eyebrow">confirmar presença</p>
            <h2 id={titleId} className="guest-modal-title">Quem vem celebrar com a gente?</h2>

            <div className="guest-modal-fields">
              {names.map((name, index) => (
                <div className="guest-modal-field" key={index}>
                  <input
                    ref={index === 0 ? firstInputRef : undefined}
                    type="text"
                    className="guest-modal-input"
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => updateName(index, e.target.value)}
                    autoComplete="name"
                  />
                  {names.length > 1 && (
                    <button
                      type="button"
                      className="guest-modal-remove"
                      onClick={() => removeField(index)}
                      aria-label="Remover este nome"
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="guest-modal-add" onClick={addField}>
              + adicionar mais uma pessoa
            </button>

            {error && <p className="guest-modal-error">{error}</p>}

            <button type="submit" className="guest-modal-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'confirmando…' : 'confirmar presença'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
