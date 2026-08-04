import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faUserPlus } from "@fortawesome/free-solid-svg-icons";

function AdminUsersHeader({ onExport }) {
  return (
    <header className="admin-users-header">
      <div>
        <p className="admin-users-breadcrumb">Administration / Utilisateurs</p>
        <h1>Gestion des utilisateurs</h1>
        <p>Consultez et gérez les comptes apprenants, formateurs et administrateurs.</p>
      </div>
      <div className="admin-users-header-actions">
        <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={onExport}>
          <FontAwesomeIcon icon={faDownload} />
          Exporter
        </button>
        <button type="button" className="admin-users-btn admin-users-btn--primary" disabled title="Création dédiée à brancher si prévue">
          <FontAwesomeIcon icon={faUserPlus} />
          Ajouter un utilisateur
        </button>
      </div>
    </header>
  );
}

export default AdminUsersHeader;

