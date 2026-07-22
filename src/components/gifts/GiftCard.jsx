import './gift-card.css';

const formatPrice = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function GiftCard({ gift, onGift, loading, error }) {
  return (
    <article className={`gift-card${gift.featured ? ' gift-card--featured' : ''}`}>
      {gift.featured && <span className="gift-card-badge">presente especial</span>}
      <div className="gift-card-photo">
        {gift.icon ? (
          <span className="gift-card-icon" aria-hidden="true">{gift.icon}</span>
        ) : (
          <img src={`/gifts/${gift.id}.jpg`} alt={gift.name} loading="lazy" />
        )}
      </div>
      <p className="gift-card-name">{gift.name}</p>
      <p className="gift-card-brand">{gift.brand}</p>
      <p className="gift-card-price">{formatPrice(gift.price)}</p>
      <button
        type="button"
        className="gift-card-btn"
        onClick={() => onGift(gift)}
        disabled={loading}
      >
        {loading ? 'abrindo pagamento...' : 'presentear'}
      </button>
      {error && <p className="gift-card-error">Não foi possível abrir o pagamento, tenta de novo.</p>}
    </article>
  );
}
