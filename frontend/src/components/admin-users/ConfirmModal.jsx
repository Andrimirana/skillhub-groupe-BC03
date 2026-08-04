function ConfirmModal({ title, message, confirmLabel = "Confirmer", danger, onConfirm, onClose }) {
  if (!title) return null;

  return (
    <div className="admin-users-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-users-modal admin-users-modal--small" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
        <button type="button" className="admin-users-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2 id="admin-confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="admin-users-modal-actions">
          <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={onClose}>Annuler</button>
          <button type="button" className={`admin-users-btn ${danger ? "admin-users-btn--danger" : "admin-users-btn--primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
