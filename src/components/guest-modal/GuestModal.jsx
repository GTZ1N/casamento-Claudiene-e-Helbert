import { useEffect, useId, useRef, useState } from 'react';
import { addGuests } from '../../lib/guests';
import { addChildrenForGuest, MAX_CHILDREN_PER_GUEST } from '../../lib/children';
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

function emptyChild() {
  return { name: '', age: '' };
}

export default function GuestModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [children, setChildren] = useState([emptyChild()]);
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState(null);
  const [rsvpOpen, setRsvpOpen] = useState(null); // null = checking | true | false
  const firstInputRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    setName('');
    setHasChildren(false);
    setChildren([emptyChild()]);
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

  const updateChildField = (index, field, value) => {
    setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addChildField = () =>
    setChildren((prev) => (prev.length < MAX_CHILDREN_PER_GUEST ? [...prev, emptyChild()] : prev));

  const removeChildField = (index) =>
    setChildren((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Preencha seu nome completo.');
      return;
    }

    const cleanChildren = hasChildren
      ? children
          .map((c) => ({ name: c.name.trim(), age: Number(c.age) }))
          .filter((c) => c.name)
      : [];

    if (hasChildren) {
      const invalid = cleanChildren.some(
        (c) => !Number.isInteger(c.age) || c.age < 0 || c.age > 12,
      );
      if (cleanChildren.length === 0) {
        setError('Preencha o nome e a idade de ao menos uma criança, ou desmarque a opção.');
        return;
      }
      if (invalid) {
        setError('Preencha uma idade válida (0 a 12) para cada criança.');
        return;
      }
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
      if (cleanChildren.length > 0) {
        await addChildrenForGuest(inserted[0].id, cleanChildren);
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

            <button
              type="button"
              className={`guest-modal-children-toggle${hasChildren ? ' guest-modal-children-toggle--active' : ''}`}
              onClick={() => setHasChildren((prev) => !prev)}
              aria-pressed={hasChildren}
            >
              <span aria-hidden="true">🧒</span> vou levar criança{hasChildren ? 's' : ''}
            </button>

            {hasChildren && (
              <div className="guest-modal-children">
                {children.map((child, index) => (
                  <div className="guest-modal-child-row" key={index}>
                    <input
                      type="text"
                      className="guest-modal-input"
                      placeholder="Nome da criança"
                      value={child.name}
                      onChange={(e) => updateChildField(index, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="guest-modal-input guest-modal-input--age"
                      placeholder="Idade"
                      min="0"
                      max="12"
                      value={child.age}
                      onChange={(e) => updateChildField(index, 'age', e.target.value)}
                    />
                    {children.length > 1 && (
                      <button
                        type="button"
                        className="guest-modal-remove"
                        onClick={() => removeChildField(index)}
                        aria-label="Remover esta criança"
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </div>
                ))}

                {children.length < MAX_CHILDREN_PER_GUEST && (
                  <button type="button" className="guest-modal-add" onClick={addChildField}>
                    + adicionar outra criança
                  </button>
                )}
              </div>
            )}

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
