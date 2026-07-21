import Monogram from '../../ui/Monogram';
import './pages.css';

export default function CoverPage() {
  return (
    <div className="book-photo-page" style={{ backgroundImage: 'url(/gallery/gallery-04.jpg)' }}>
      <div className="book-page-inner">
        <Monogram size="sm" />
        <p className="book-eyebrow">com a bênção de seus pais</p>
        <p className="book-names">
          Claudiene
          <br />e Helbert
        </p>
        <span className="book-divider" />
        <p className="book-eyebrow">a realizar-se no dia</p>
        <p className="book-date">17 &middot; 10 &middot; 2026</p>
        <p className="book-time">Sábado, às 15h30</p>
        <span className="book-divider" />
        <p className="book-venue">Chácara Recanto das Palmeiras</p>
      </div>
    </div>
  );
}
