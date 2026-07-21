import { useScrollReveal } from '../hooks/useScrollReveal';
import GalleryCarousel from '../components/gallery/GalleryCarousel';
import './gallery-section.css';

export default function GallerySection() {
  const headingRef = useScrollReveal({ y: 22, stagger: 0.12 });
  const carouselRef = useScrollReveal({ y: 26, start: 'top 82%' });

  return (
    <section className="section gallery-section">
      <div className="section-inner" ref={headingRef}>
        <p className="section-eyebrow">galeria de fotos</p>
        <h2 className="section-title">Nós dois</h2>
        <span className="section-divider" />
      </div>
      <div ref={carouselRef}>
        <GalleryCarousel />
      </div>
    </section>
  );
}
