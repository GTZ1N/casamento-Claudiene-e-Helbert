import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { listGuests, subscribeGuests } from '../lib/guests';
import { isRsvpOpen, setRsvpOpen, subscribeRsvpStatus } from '../lib/rsvpStatus';
import './confirmed-guests-section.css';

export default function ConfirmedGuestsSection() {
  const ref = useScrollReveal({ targets: '.confirmed-reveal', y: 22, stagger: 0.1 });
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [rsvpOpen, setRsvpOpenState] = useState(null); // null = checking | true | false
  const [toggling, setToggling] = useState(false);

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
      </div>

      {status === 'ready' && guests.length === 0 && (
        <p className="confirmed-empty confirmed-reveal">
          Seja o primeiro a confirmar presença!
        </p>
      )}

      {guests.length > 0 && (
        <ul className="confirmed-list confirmed-reveal">
          {guests.map((guest) => (
            <li className="confirmed-item" key={guest.id}>
              <span className="confirmed-check" aria-hidden="true">&#10003;</span>
              {guest.full_name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
