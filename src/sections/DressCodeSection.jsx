import { useScrollReveal } from '../hooks/useScrollReveal';
import './dress-code-section.css';

export default function DressCodeSection() {
  const ref = useScrollReveal({ targets: '.dress-code-reveal', y: 22, stagger: 0.14 });

  return (
    <section className="section dress-code-section" id="dress-code" ref={ref}>
      <div className="section-inner dress-code-reveal">
        <p className="section-eyebrow">dress code</p>
        <h2 className="section-title">Esporte fino</h2>
        <span className="section-divider" />
        <p className="dress-code-note">
          Pedimos apenas que evitem roupas nas cores <strong>branca</strong>,{' '}
          <strong>rosa bebê</strong> (cor das madrinhas) e <strong>azul royal</strong> (cor do
          noivo).
        </p>
        <p className="dress-code-thanks">Agradecemos o carinho e a compreensão. 🤍</p>
      </div>
    </section>
  );
}
