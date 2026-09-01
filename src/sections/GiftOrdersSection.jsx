import { useEffect, useState } from 'react';
import { listGiftOrders } from '../lib/giftOrders';
import './gift-orders-section.css';

const STATUS_LABEL = {
  approved: 'Pago',
  pending: 'Aguardando pagamento',
  rejected: 'Não concluído',
};

const formatPrice = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function GiftOrdersSection() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus((s) => (s === 'ready' ? s : 'loading'));

    listGiftOrders()
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (status === 'error') {
    return (
      <section className="section gift-orders-section">
        <div className="section-inner">
          <p className="section-eyebrow">painel da lista</p>
          <h2 className="section-title">Presentes recebidos</h2>
          <span className="section-divider" />
          <p className="confirmed-admin-error">
            Não foi possível carregar agora. Verifique sua internet e tente de novo.
          </p>
          <button
            type="button"
            className="confirmed-admin-btn"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const approvedTotal = orders
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => sum + Number(o.price), 0);

  return (
    <section className="section gift-orders-section">
      <div className="section-inner">
        <p className="section-eyebrow">painel da lista</p>
        <h2 className="section-title">Presentes recebidos</h2>
        <span className="section-divider" />

        {status === 'ready' && (
          <div className="gift-orders-stats">
            <div className="gift-orders-stat">
              <span className="gift-orders-stat-value">
                {orders.filter((o) => o.status === 'approved').length}
              </span>
              <span className="gift-orders-stat-label">Presentes pagos</span>
            </div>
            <div className="gift-orders-stat">
              <span className="gift-orders-stat-value">{formatPrice(approvedTotal)}</span>
              <span className="gift-orders-stat-label">Total recebido</span>
            </div>
          </div>
        )}

        {status === 'ready' && orders.length === 0 && (
          <p className="gift-orders-empty">Ninguém presenteou pela lista ainda.</p>
        )}
      </div>

      {status === 'ready' && orders.length > 0 && (
        <ul className="gift-orders-list">
          {orders.map((order) => (
            <li className="gift-orders-item" key={order.id}>
              <span className={`gift-orders-status gift-orders-status--${order.status}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <span className="gift-orders-name-block">
                <span className="gift-orders-giver">{order.giver_name}</span>
                <span className="gift-orders-gift">
                  {order.gift_name} — {formatPrice(order.price)}
                </span>
                {order.giver_message && (
                  <span className="gift-orders-message">&#8220;{order.giver_message}&#8221;</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
