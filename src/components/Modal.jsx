import { useEffect, useRef } from 'react';
import { Icon } from './ui.jsx';

export default function Modal({ title, children, actions = [], onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-x" onClick={onClose} aria-label="Close">
          <Icon.x />
        </button>
        <h2 id="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        {actions.length > 0 && (
          <div className="modal-actions">
            {actions.map((a) => (
              <button key={a.label} className={`btn ${a.primary ? 'btn-primary' : 'btn-ghost'}`} onClick={a.onClick}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
