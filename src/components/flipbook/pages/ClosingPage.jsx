import Monogram from '../../ui/Monogram';
import './pages.css';

export default function ClosingPage() {
  return (
    <div className="book-photo-page" style={{ backgroundImage: 'url(/gallery/gallery-14.jpg)' }}>
      <div className="book-page-inner">
        <Monogram size="sm" />
        <p className="book-closing-note">Esperamos por vocês</p>
      </div>
    </div>
  );
}
