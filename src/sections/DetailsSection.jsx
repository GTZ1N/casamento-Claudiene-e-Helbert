import { useScrollReveal } from '../hooks/useScrollReveal';
import Countdown from '../components/ui/Countdown';
import './details-section.css';

const VENUE_NAME = 'Chácara Recanto das Palmeiras';
const VENUE_ADDRESS =
  'Chácara Recanto das Palmeiras, R. Pará, 357 - Granjas Primavera, Ribeirão das Neves - MG, 33940-120';
const MAPS_URL = 'https://maps.app.goo.gl/L3BbEsfWPn5S2Z8M8?g_st=ic';
const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(VENUE_ADDRESS)}&output=embed`;

export default function DetailsSection() {
  const ref = useScrollReveal({ targets: '.details-reveal', y: 26, stagger: 0.14 });

  return (
    <section className="section details-section" id="local" ref={ref}>
      <div className="section-inner details-reveal">
        <p className="section-eyebrow">quando &amp; onde</p>
        <h2 className="section-title">Guarde a data</h2>
        <span className="section-divider" />
      </div>

      <Countdown />

      <div className="details-grid">
        <div className="details-card details-reveal">
          <span className="details-card-label">data</span>
          <span className="details-card-value">17 de outubro</span>
          <span className="details-card-sub">de 2026 &middot; sábado</span>
        </div>
        <div className="details-card details-reveal">
          <span className="details-card-label">horário</span>
          <span className="details-card-value">15h30</span>
          <span className="details-card-sub">cerimônia</span>
        </div>
        <div className="details-card details-reveal">
          <span className="details-card-label">local</span>
          <span className="details-card-value details-card-value--sm">{VENUE_NAME}</span>
          <a
            className="details-map-link"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            abrir no google maps
          </a>
        </div>
      </div>

      <div className="details-map-embed details-reveal">
        <iframe
          title={`Mapa de ${VENUE_NAME}`}
          src={MAPS_EMBED_URL}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
