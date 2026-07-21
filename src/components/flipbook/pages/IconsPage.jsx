import { Link } from 'react-router-dom';
import { scrollToId } from '../../../lib/lenis-instance';
import './pages.css';
import './icons-page.css';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const LINKS = [
  {
    label: 'Saiba como chegar',
    id: 'local',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.4" />
      </svg>
    ),
  },
  {
    label: 'Para nos presentear',
    id: 'presentes',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="4" y="9.5" width="16" height="10.5" rx="1.4" />
        <path d="M4 13.5h16" />
        <path d="M12 9.5v10.5" />
        <path d="M12 9.5C10.5 9.5 9 8.7 9 7.2 9 6 9.9 5.5 10.7 5.5c1 0 1.3.9 1.3 1.7M12 9.5c1.5 0 3-.8 3-2.3 0-1.2-.9-1.7-1.7-1.7-1 0-1.3.9-1.3 1.7" />
      </svg>
    ),
  },
  {
    label: 'Confirmar presença',
    id: 'rsvp',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.3l2.6 2.6L16 9.3" />
      </svg>
    ),
  },
  {
    label: 'Dress code',
    id: 'dress-code',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 4l3 2.4L15 4l3 3-2.5 2.3V20H8.5V9.3L6 7z" />
      </svg>
    ),
  },
  {
    label: 'Manual dos convidados',
    id: 'manual',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M5 4.5h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z" />
        <path d="M5 17.5h13" />
      </svg>
    ),
  },
];

export default function IconsPage() {
  return (
    <div className="book-photo-page" style={{ backgroundImage: 'url(/gallery/gallery-06.jpg)' }}>
      <div className="book-page-inner icons-page-inner">
        <p className="book-eyebrow">toque nos ícones</p>
        <p className="book-names icons-page-title">para interagir</p>

        <div className="icons-page-grid">
          {LINKS.map((link) => {
            if (link.href) {
              return (
                <a
                  key={link.label}
                  className="icons-page-item"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="icons-page-icon">{link.icon}</span>
                  <span className="icons-page-label">{link.label}</span>
                </a>
              );
            }
            if (link.to) {
              return (
                <Link key={link.label} className="icons-page-item" to={link.to}>
                  <span className="icons-page-icon">{link.icon}</span>
                  <span className="icons-page-label">{link.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={link.label}
                type="button"
                className="icons-page-item"
                onClick={() => scrollToId(link.id)}
              >
                <span className="icons-page-icon">{link.icon}</span>
                <span className="icons-page-label">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
