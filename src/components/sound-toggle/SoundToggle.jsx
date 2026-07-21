import { useEffect, useRef, useState } from 'react';
import './sound-toggle.css';

function SpeakerOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 9l5 6" />
      <path d="M21 9l-5 6" />
    </svg>
  );
}

const LOOP_START = 20;

export default function SoundToggle({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = 'none';
    // Native `loop` always restarts at 0 — we want the loop to restart at
    // LOOP_START instead, so loop is handled manually via `ended`.
    const onEnded = () => {
      audio.currentTime = LOOP_START;
      audio.play().catch(() => {});
    };
    audio.addEventListener('ended', onEnded);
    audioRef.current = audio;
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      if (audio.currentTime === 0) audio.currentTime = LOOP_START;
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={toggle}
      aria-label={playing ? 'Desativar música' : 'Ativar música'}
      aria-pressed={playing}
    >
      {playing ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
    </button>
  );
}
