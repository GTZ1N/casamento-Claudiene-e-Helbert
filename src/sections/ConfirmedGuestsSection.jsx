import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  adminAddGuest,
  deleteGuest,
  listGuests,
  subscribeGuests,
  updateGuest,
} from '../lib/guests';
import { isRsvpOpen, setRsvpOpen, subscribeRsvpStatus } from '../lib/rsvpStatus';
import './confirmed-guests-section.css';

export default function ConfirmedGuestsSection() {
  const ref = useScrollReveal({ targets: '.confirmed-reveal', y: 22, stagger: 0.1 });
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [rsvpOpen, setRsvpOpenState] = useState(null); // null = checking | true | false
  const [toggling, setToggling] = useState(false);

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listGuests();
        if (!cancelled) {
          setGuests(data);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    const loadRsvpStatus = () => {
      isRsvpOpen()
        .then((open) => {
          if (!cancelled) setRsvpOpenState(open);
        })
        .catch(() => {
          if (!cancelled) setRsvpOpenState(null);
        });
    };

    load();
    loadRsvpStatus();
    const unsubscribeGuests = subscribeGuests(load);
    const unsubscribeRsvp = subscribeRsvpStatus(loadRsvpStatus);
    return () => {
      cancelled = true;
      unsubscribeGuests();
      unsubscribeRsvp();
    };
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await setRsvpOpen(!rsvpOpen);
      setRsvpOpenState(!rsvpOpen);
    } catch {
      // silencioso — o botão simplesmente não muda de estado; tentar de novo.
    } finally {
      setToggling(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await adminAddGuest(newName);
      setNewName('');
    } catch (err) {
      setAddError(err.message || 'Não foi possível adicionar agora.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (guest) => {
    setRowError(null);
    setEditingId(guest.id);
    setEditingName(guest.full_name);
    setEditingPhone(guest.phone || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingPhone('');
  };

  const saveEdit = async (id) => {
    setSavingId(id);
    setRowError(null);
    try {
      await updateGuest(id, { name: editingName, phone: editingPhone });
      setEditingId(null);
      setEditingName('');
      setEditingPhone('');
    } catch (err) {
      setRowError(err.message || 'Não foi possível salvar agora.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setRowError(null);
    try {
      await deleteGuest(id);
    } catch (err) {
      setRowError(err.message || 'Não foi possível excluir agora.');
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'error') return null;

  return (
    <section className="section confirmed-guests-section" ref={ref}>
      <div className="section-inner confirmed-reveal">
        <p className="section-eyebrow">quem já confirmou</p>
        <h2 className="section-title">Convidados confirmados</h2>
        <span className="section-divider" />

        {rsvpOpen !== null && (
          <div className="confirmed-admin-toggle">
            <p className="confirmed-admin-status">
              Confirmações estão {rsvpOpen ? 'abertas' : 'fechadas'}.
            </p>
            <button
              type="button"
              className="confirmed-admin-btn"
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? 'aplicando…' : rsvpOpen ? 'Fechar lista' : 'Abrir lista'}
            </button>
          </div>
        )}

        <form className="confirmed-admin-add" onSubmit={handleAdd}>
          <input
            type="text"
            className="confirmed-admin-input"
            placeholder="Adicionar convidado"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="confirmed-admin-btn" disabled={adding}>
            {adding ? 'adicionando…' : '+ adicionar'}
          </button>
        </form>
        {addError && <p className="confirmed-admin-error">{addError}</p>}
      </div>

      {status === 'ready' && guests.length === 0 && (
        <p className="confirmed-empty confirmed-reveal">
          Seja o primeiro a confirmar presença!
        </p>
      )}

      {rowError && <p className="confirmed-admin-error confirmed-reveal">{rowError}</p>}

      {guests.length > 0 && (
        <ul className="confirmed-list confirmed-reveal">
          {guests.map((guest) => (
            <li className="confirmed-item" key={guest.id}>
              {editingId === guest.id ? (
                <>
                  <input
                    type="text"
                    className="confirmed-admin-input confirmed-admin-input--inline"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="tel"
                    className="confirmed-admin-input confirmed-admin-input--inline"
                    placeholder="Celular"
                    value={editingPhone}
                    onChange={(e) => setEditingPhone(e.target.value)}
                  />
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={() => saveEdit(guest.id)}
                    disabled={savingId === guest.id}
                    aria-label="Salvar"
                  >
                    {savingId === guest.id ? '…' : '✓'}
                  </button>
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={cancelEdit}
                    aria-label="Cancelar"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="confirmed-check" aria-hidden="true">&#10003;</span>
                  <span className="confirmed-name">
                    {guest.full_name}
                    {guest.phone && <span className="confirmed-phone"> — {guest.phone}</span>}
                  </span>
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={() => startEdit(guest)}
                    aria-label="Editar"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={() => handleDelete(guest.id)}
                    disabled={deletingId === guest.id}
                    aria-label="Excluir"
                  >
                    {deletingId === guest.id ? '…' : '🗑'}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
