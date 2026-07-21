import { useScrollReveal } from '../../hooks/useScrollReveal';
import './photo-moment.css';

export default function PhotoMoment({ src, alt, quote, focalPoint, fit = 'cover' }) {
  const ref = useScrollReveal({ targets: '.photo-moment-reveal', y: 30, stagger: 0.15, start: 'top 80%' });

  return (
    <div className="photo-moment" ref={ref}>
      <div className="photo-moment-inner">
        <figure className={`photo-moment-frame photo-moment-reveal${fit === 'contain' ? ' photo-moment-frame--contain' : ''}`}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={focalPoint ? { objectPosition: focalPoint } : undefined}
          />
        </figure>
        <p className="photo-moment-quote photo-moment-reveal">{quote}</p>
      </div>
    </div>
  );
}
