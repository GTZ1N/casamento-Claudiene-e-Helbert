import { useScrollReveal } from '../hooks/useScrollReveal';
import floralPattern from '../assets/floral-pattern.svg';
import './verse-section.css';

export default function VerseSection() {
  const ref = useScrollReveal({ targets: '.verse-reveal', y: 20, stagger: 0.18, start: 'top 70%' });

  return (
    <section className="section verse-section" ref={ref}>
      <div
        className="verse-floral-backdrop"
        aria-hidden="true"
        style={{ backgroundImage: `url("${floralPattern}")` }}
      />
      <div className="verse-overlay" aria-hidden="true" />
      <div className="verse-content">
        <div className="verse-ornament verse-reveal" aria-hidden="true">&#10047;</div>
        <p className="verse-quote verse-reveal">
          &ldquo;Assim, eles já não são dois, mas uma só carne.
          <br />
          Portanto, o que Deus uniu, ninguém separe.&rdquo;
        </p>
        <span className="verse-reference verse-reveal">Mateus 19:6</span>
      </div>
    </section>
  );
}
