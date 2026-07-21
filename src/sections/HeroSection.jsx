import { useScrollReveal } from '../hooks/useScrollReveal';
import monogramMark from '../assets/monogram-mark.png';
import './hero-section.css';

export default function HeroSection() {
  const ref = useScrollReveal({ targets: '.hero-reveal', y: 18, stagger: 0.15 });

  return (
    <section className="section hero-section" ref={ref}>
      <img
        className="hero-bg"
        src="/gallery/gallery-26.jpg"
        alt=""
        aria-hidden="true"
        loading="eager"
      />
      <img
        className="hero-mark hero-reveal"
        src={monogramMark}
        alt="Monograma Claudiene & Helbert"
        width="900"
        height="900"
      />
    </section>
  );
}
