import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { listGuests, subscribeGuests } from '../lib/guests';
import { addChildToGuest, deleteChild, listAllChildren, subscribeChildren, updateChild } from '../lib/children';
import './confirmed-guests-section.css';

export default function ConfirmedChildrenSection() {
  const ref = useScrollReveal({ targets: '.confirmed-reveal', y: 22, stagger: 0.1 });
  const [children, setChildren] = useState([]);
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const [newGuestId, setNewGuestId] = useState('');
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingAge, setEditingAge] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listAllChildren();
        if (!cancelled) {
          setChildren(data);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    const loadGuests = async () => {
      try {
        const data = await listGuests();
        if (!cancelled) setGuests(data);
      } catch {
        // silencioso — o seletor de convidados fica vazio, o resto da seção continua.
      }
    };

    load();
    loadGuests();
    const unsubscribeChildren = subscribeChildren(load);
    const unsubscribeGuests = subscribeGuests(loadGuests);
    return () => {
      cancelled = true;
      unsubscribeChildren();
      unsubscribeGuests();
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newGuestId || !newName.trim() || newAge === '') return;
    setAdding(true);
    setAddError(null);
    try {
      await addChildToGuest(newGuestId, newName, Number(newAge));
      setNewName('');
      setNewAge('');
    } catch (err) {
      setAddError(err.message || 'Não foi possível adicionar agora.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (child) => {
    setRowError(null);
    setEditingId(child.id);
    setEditingName(child.name);
    setEditingAge(String(child.age));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingAge('');
  };

  const saveEdit = async (id) => {
    setSavingId(id);
    setRowError(null);
    try {
      await updateChild(id, { name: editingName, age: Number(editingAge) });
      setEditingId(null);
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
      await deleteChild(id);
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
        <p className="section-eyebrow">quem vem com criança</p>
        <h2 className="section-title">Crianças confirmadas</h2>
        <span className="section-divider" />

        <form className="confirmed-admin-add confirmed-admin-add--child" onSubmit={handleAdd}>
          <select
            className="confirmed-admin-input"
            value={newGuestId}
            onChange={(e) => setNewGuestId(e.target.value)}
          >
            <option value="">Convidado…</option>
            {guests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.full_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="confirmed-admin-input"
            placeholder="Nome da criança"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="number"
            className="confirmed-admin-input confirmed-admin-input--age"
            placeholder="Idade"
            min="0"
            max="17"
            value={newAge}
            onChange={(e) => setNewAge(e.target.value)}
          />
          <button type="submit" className="confirmed-admin-btn" disabled={adding}>
            {adding ? 'adicionando…' : '+ adicionar'}
          </button>
        </form>
        {addError && <p className="confirmed-admin-error">{addError}</p>}
      </div>

      {status === 'ready' && children.length === 0 && (
        <p className="confirmed-empty confirmed-reveal">Nenhuma criança confirmada ainda.</p>
      )}

      {rowError && <p className="confirmed-admin-error confirmed-reveal">{rowError}</p>}

      {children.length > 0 && (
        <ul className="confirmed-list confirmed-reveal">
          {children.map((child) => (
            <li className="confirmed-item" key={child.id}>
              {editingId === child.id ? (
                <>
                  <input
                    type="text"
                    className="confirmed-admin-input confirmed-admin-input--inline"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="number"
                    className="confirmed-admin-input confirmed-admin-input--age"
                    min="0"
                    max="17"
                    value={editingAge}
                    onChange={(e) => setEditingAge(e.target.value)}
                  />
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={() => saveEdit(child.id)}
                    disabled={savingId === child.id}
                    aria-label="Salvar"
                  >
                    {savingId === child.id ? '…' : '✓'}
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
                  <span className="confirmed-check" aria-hidden="true">🧒</span>
                  <span className="confirmed-name">
                    {child.name} <span className="confirmed-child-meta">({child.age} anos — {child.guestName})</span>
                  </span>
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={() => startEdit(child)}
                    aria-label="Editar"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="confirmed-row-btn"
                    onClick={() => handleDelete(child.id)}
                    disabled={deletingId === child.id}
                    aria-label="Excluir"
                  >
                    {deletingId === child.id ? '…' : '🗑'}
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
