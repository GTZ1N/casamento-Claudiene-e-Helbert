import { useEffect, useState } from 'react';
import './countdown.css';

const TARGET_DATE = new Date('2026-10-17T15:30:00-03:00');

const UNITS = [
  { key: 'days', label: 'dias' },
  { key: 'hours', label: 'horas' },
  { key: 'minutes', label: 'minutos' },
  { key: 'seconds', label: 'segundos' },
];

function getTimeLeft() {
  const diff = Math.max(0, TARGET_DATE.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown-block">
      <p className="countdown-title">Contagem Regressiva</p>
      <div className="countdown" role="timer" aria-label="Contagem regressiva para o casamento">
        {UNITS.map(({ key, label }) => (
          <div className="countdown-unit" key={key}>
            <span className="countdown-value">{String(timeLeft[key]).padStart(2, '0')}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
