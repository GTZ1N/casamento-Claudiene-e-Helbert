import './monogram.css';

/**
 * The couple's initials rendered in the calligraphic display face. Reused
 * everywhere a compact brand-mark is needed — the letter cover, the letter
 * inside, and later the site header.
 */
export default function Monogram({ size = 'md' }) {
  return (
    <span className={`monogram monogram--${size}`} aria-hidden="true">
      C <span className="monogram-amp">&amp;</span> H
    </span>
  );
}
