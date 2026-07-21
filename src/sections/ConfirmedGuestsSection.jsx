import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { listGuests, subscribeGuests } from '../lib/guests';
import './confirmed-guests-section.css';

export default function ConfirmedGuestsSection() {
  const ref = useScrollReveal({ targets: '.confirmed-reveal', y: 22, stagger: 0.1 });
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

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

    load();
    const unsubscribe = subscribeGuests(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (status === 'error') return null;

  return (
    <section className="section confirmed-guests-section" ref={ref}>
      <div className="section-inner confirmed-reveal">
        <p className="section-eyebrow">quem já confirmou</p>
        <h2 className="section-title">Convidados confirmados</h2>
        <span className="section-divider" />
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
