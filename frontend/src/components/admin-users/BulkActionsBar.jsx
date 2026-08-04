function BulkActionsBar({ count, onAction, onClear }) {
  if (!count) return null;

  return (
    <aside className="admin-users-bulk">
      <strong>{count} utilisateur(s) sélectionné(s)</strong>
      <div>
        <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={() => onAction("status", "actif")}>Activer</button>
        <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={() => onAction("status", "desactive")}>Désactiver</button>
        <button type="button" className="admin-users-btn admin-users-btn--danger" onClick={() => onAction("delete")}>Archiver</button>
        <button type="button" className="admin-users-link-btn" onClick={onClear}>Annuler</button>
      </div>
    </aside>
  );
}

export default BulkActionsBar;

