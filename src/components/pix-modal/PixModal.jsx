import { useEffect, useId, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PIX_PAYLOAD, PIX_RECEIVER_NAME } from '../../lib/pix';
import './pix-modal.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

const formatPrice = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PixModal({ open, onClose, gift }) {
  const [copied, setCopied] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    setCopied(false);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_PAYLOAD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pix-modal-backdrop" onMouseDown={onClose}>
      <div
        className="pix-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="pix-modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon />
        </button>

        <p className="section-eyebrow">presente via pix</p>
        <h2 id={titleId} className="pix-modal-title">
          {gift ? gift.name : 'Presenteie com o valor que quiser'}
        </h2>
        <p className="pix-modal-note">
          {gift ? (
            <>
              Escaneie o QR Code e informe <strong>{formatPrice(gift.price)}</strong> no seu
              banco — esse é o valor deste presente.
            </>
          ) : (
            'Escaneie o QR Code pelo app do seu banco ou copie a chave abaixo.'
          )}
        </p>

        <div className="pix-modal-qr">
          <QRCodeSVG value={PIX_PAYLOAD} size={220} level="M" bgColor="#fff5f6" fgColor="#171c21" />
        </div>

        <button type="button" className="pix-modal-copy" onClick={handleCopy}>
          {copied ? 'chave copiada!' : 'copiar chave pix'}
        </button>

        <p className="pix-modal-receiver">{PIX_RECEIVER_NAME}</p>
      </div>
    </div>
  );
}
