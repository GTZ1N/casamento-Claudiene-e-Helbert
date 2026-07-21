import { useScrollReveal } from '../hooks/useScrollReveal';
import './guest-manual-section.css';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const RULES = [
  {
    text: 'Confirme sua presença.',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.3l2.6 2.6L16 9.3" />
      </svg>
    ),
  },
  {
    text: 'Deixe seu celular no silencioso!',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
        <line x1="4" y1="4" x2="20" y2="20" />
      </svg>
    ),
  },
  {
    text: 'Não se atrase. Seja pontual.',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5.2l3.4 2" />
      </svg>
    ),
  },
  {
    text: 'Aguarde a liberação da mesa de doces.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M5.5 11.5h13L17 20.5H7z" />
        <path d="M8 11.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
        <path d="M12 7.5c1.1 0 1.8-.9 1.4-1.9-.2-.6-.9-.7-.9-1.4 0-.5.4-.8.9-.7" />
      </svg>
    ),
  },
  {
    text: 'Branco é a cor da noiva.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 4c1.6 1.4 1.6 3.2 0 4.4C10.4 7.2 10.4 5.4 12 4Z" />
        <path d="M12 4c-1.6 1.4-1.6 3.2 0 4.4" />
        <path d="M7.6 6.6c.6 2 2.1 3 4.4 3.4 2.3-.4 3.8-1.4 4.4-3.4" />
        <path d="M12 9.8V20" />
        <path d="M8.5 20l3.5-6 3.5 6z" />
      </svg>
    ),
  },
  {
    text: 'Não atrapalhe os fotógrafos.',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="7.5" width="18" height="12" rx="2" />
        <circle cx="12" cy="13.5" r="3.4" />
        <path d="M8.5 7.5l1.2-2.2h4.6l1.2 2.2" />
      </svg>
    ),
  },
  {
    text: 'Não faça comentários negativos.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 5.5h16v10H9.5L6 19v-3.5H4z" />
        <path d="M12 8.6c1-1.2 2.8-.5 2.8.9 0 1.3-1.4 2-2.8 3.1-1.4-1.1-2.8-1.8-2.8-3.1 0-1.4 1.8-2.1 2.8-.9Z" />
      </svg>
    ),
  },
  {
    text: 'Não saia sem se despedir dos noivos!',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="12" r="4" />
        <circle cx="15" cy="12" r="4" />
      </svg>
    ),
  },
  {
    text: 'Participe da cerimônia.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 21V11.5C6 8 8.7 5.5 12 5.5s6 2.5 6 6V21" />
        <path d="M12 2v3" />
        <path d="M10.5 3.5h3" />
        <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
      </svg>
    ),
  },
  {
    text: 'Aproveite muito a festa.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v3.2M5.6 6.6l2.2 2.2M18.4 6.6l-2.2 2.2M3 13h3.2M17.8 13H21" />
        <circle cx="12" cy="13" r="2.6" />
      </svg>
    ),
  },
];

export default function GuestManualSection() {
  const ref = useScrollReveal({ targets: '.manual-reveal', y: 22, stagger: 0.1 });

  return (
    <section className="section guest-manual-section" id="manual" ref={ref}>
      <div className="section-inner manual-reveal">
        <p className="section-eyebrow">boas maneiras</p>
        <h2 className="section-title">Manual do convidado</h2>
        <span className="section-divider" />
      </div>

      <ul className="manual-grid">
        {RULES.map((rule) => (
          <li className="manual-rule manual-reveal" key={rule.text}>
            <span className="manual-rule-icon">{rule.icon}</span>
            <span className="manual-rule-text">{rule.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
