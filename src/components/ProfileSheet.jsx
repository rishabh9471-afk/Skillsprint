import { useState } from 'react';
import Modal from './Modal.jsx';
import { Icon } from './ui.jsx';

export default function ProfileSheet({ visitor, progress, onClose, onCopied, onSignOut }) {
  const [copied, setCopied] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(visitor.recoveryCode);
      setCopied(true);
      onCopied();
    } catch {
      /* clipboard blocked; code is visible */
    }
  }

  return (
    <Modal title={`${visitor.nickname} #${visitor.tag}`} onClose={onClose}>
      <p className="muted">
        {progress.totalXp} XP · {Object.keys(progress.completed).length} scenarios completed
      </p>
      {visitor.recoveryCode ? (
        <div className="code">
          <strong>Your recovery code</strong>
          <p className="muted small">Restores your XP on any device.</p>
          <div className="code-row">
            <code className="code-value">{visitor.recoveryCode}</code>
            <button className="btn btn-ghost" onClick={copy}>
              <Icon.copy /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : (
        <p className="muted small">A recovery code isn't available for this profile because our database was unreachable when it was created.</p>
      )}
      <hr />
      {!confirmOut ? (
        <button className="link-btn" onClick={() => setConfirmOut(true)}>
          Switch profile on this device
        </button>
      ) : (
        <div className="confirm-out">
          <p className="small">
            This removes your profile from this device. {visitor.recoveryCode ? 'You can bring it back later with your recovery code.' : 'Without a recovery code, it cannot be restored.'}
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmOut(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={onSignOut}>
              Remove from this device
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
