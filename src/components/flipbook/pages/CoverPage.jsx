import Monogram from '../../ui/Monogram';
import './pages.css';

export default function CoverPage() {
  return (
    <div className="book-photo-page" style={{ backgroundImage: 'url(/gallery/gallery-04.jpg)' }}>
      <div className="book-page-inner">
        <Monogram size="sm" />
        <p className="book-eyebrow">com a bênção de deus e de nossos familiares</p>
        <p className="book-names">
          Claudiene
          <br />e Helbert
        </p>
        <p className="book-invite-line">
          convidam você(s) para celebrar este dia tão especial.
        </p>
        <span className="book-divider" />
        <p className="book-date">17 de outubro de 2026</p>
        <p className="book-time">Sábado, às 15h30</p>
        <p className="book-invite-line">Cerimônia e recepção</p>
        <span className="book-divider" />
        <p className="book-venue">Chácara Recanto das Palmeiras</p>
      </div>
    </div>
  );
}
