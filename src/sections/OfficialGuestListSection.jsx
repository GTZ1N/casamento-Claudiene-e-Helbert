import { useEffect, useState } from 'react';
import {
  adminAddOfficialGuest,
  deleteOfficialGuest,
  describeRemovalImpact,
  getGuestListStats,
  listOfficialGuests,
  subscribeOfficialGuestList,
  updateOfficialGuest,
} from '../lib/officialGuestList';
import { listGuests, subscribeGuests } from '../lib/guests';
import { subscribeRsvpStatus } from '../lib/rsvpStatus';
import './official-guest-list-section.css';

export default function OfficialGuestListSection() {
  const [guests, setGuests] = useState([]);
  const [confirmedCountByName, setConfirmedCountByName] = useState(new Map());
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [officialGuests, confirmed, guestStats] = await Promise.all([
          listOfficialGuests(),
          listGuests(),
          getGuestListStats(),
        ]);
        if (cancelled) return;
        setGuests(officialGuests);
        const counts = new Map();
        for (const g of confirmed) {
          counts.set(g.full_name_normalized, (counts.get(g.full_name_normalized) || 0) + 1);
        }
        setConfirmedCountByName(counts);
        setStats(guestStats);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    load();
    const unsubscribeList = subscribeOfficialGuestList(load);
    const unsubscribeGuests = subscribeGuests(load);
    const unsubscribeRsvp = subscribeRsvpStatus(load);
    return () => {
      cancelled = true;
      unsubscribeList();
      unsubscribeGuests();
      unsubscribeRsvp();
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await adminAddOfficialGuest(newName);
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id) => {
    setSavingId(id);
    setRowError(null);
    try {
      await updateOfficialGuest(id, editingName);
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setRowError(err.message || 'Não foi possível salvar agora.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (guest) => {
    setRowError(null);
    let confirmText = 'Tem certeza que deseja remover este convidado?';
    try {
      const impact = await describeRemovalImpact(guest.id);
      if (impact.willExceedCapacity) {
        confirmText +=
          '\n\nJá existe mais gente confirmada com esse nome do que vagas vão sobrar na lista — remover também vai apagar a confirmação mais recente feita com esse nome.';
      }
    } catch {
      // silencioso — segue com o texto genérico se a checagem de impacto falhar.
    }

    if (!window.confirm(confirmText)) return;

    setDeletingId(guest.id);
    try {
      await deleteOfficialGuest(guest.id);
    } catch (err) {
      setRowError(err.message || 'Não foi possível remover agora.');
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'error') return null;

  return (
    <section className="section official-guest-list-section">
      <div className="section-inner">
        <p className="section-eyebrow">painel da lista</p>
        <h2 className="section-title">Lista oficial de convidados</h2>
        <span className="section-divider" />

        {stats && (
          <div className="official-stats">
            <div className="official-stat">
              <span className="official-stat-value">{stats.total}</span>
              <span className="official-stat-label">Convidados</span>
            </div>
            <div className="official-stat">
              <span className="official-stat-value">{stats.confirmed}</span>
              <span className="official-stat-label">Confirmados</span>
            </div>
            <div className="official-stat">
              <span className="official-stat-value">{stats.pending}</span>
              <span className="official-stat-label">Pendentes</span>
            </div>
            <div className="official-stat">
              <span className="official-stat-value">{stats.percent}%</span>
              <span className="official-stat-label">Progresso</span>
            </div>
            <div className="official-stat">
              <span className="official-stat-value">{stats.isOpen ? 'Aberta' : 'Fechada'}</span>
              <span className="official-stat-label">Status da lista</span>
            </div>
          </div>
        )}

        <form className="confirmed-admin-add" onSubmit={handleAdd}>
          <input
            type="text"
            className="confirmed-admin-input"
            placeholder="Adicionar convidado à lista oficial"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="confirmed-admin-btn" disabled={adding}>
            {adding ? 'adicionando…' : '+ adicionar'}
          </button>
        </form>
        {addError && <p className="confirmed-admin-error">{addError}</p>}
        {rowError && <p className="confirmed-admin-error">{rowError}</p>}
      </div>

      {status === 'ready' && guests.length > 0 && (
        <ul className="official-list">
          {(() => {
            const seenCountByName = new Map();
            return guests.map((guest) => {
              const seen = seenCountByName.get(guest.full_name_normalized) || 0;
              seenCountByName.set(guest.full_name_normalized, seen + 1);
              const capacityUsed = confirmedCountByName.get(guest.full_name_normalized) || 0;
              const isConfirmed = seen < capacityUsed;
              return (
              <li className="official-item" key={guest.id}>
                {editingId === guest.id ? (
                  <>
                    <input
                      type="text"
                      className="confirmed-admin-input confirmed-admin-input--inline"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
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
                    <span className="official-status-dot" aria-hidden="true">
                      {isConfirmed ? '🟢' : '🔴'}
                    </span>
                    <span className="official-name">
                      {guest.full_name}
                      <span className="official-status-text">
                        {' '}
                        — {isConfirmed ? 'Confirmada' : 'Pendente'}
                      </span>
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
                      onClick={() => handleDelete(guest)}
                      disabled={deletingId === guest.id}
                      aria-label="Remover"
                    >
                      {deletingId === guest.id ? '…' : '🗑'}
                    </button>
                  </>
                )}
              </li>
              );
            });
          })()}
        </ul>
      )}
    </section>
  );
}
