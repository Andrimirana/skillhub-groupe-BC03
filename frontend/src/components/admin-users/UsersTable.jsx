import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPen, faPowerOff, faTrash, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { UserRoleBadge, UserStatusBadge } from "./UserBadges";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function Avatar({ user }) {
  const initial = (user.nom || user.email || "?").charAt(0).toUpperCase();
  return user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{initial}</span>;
}

function UsersTable({
  users,
  selectedIds,
  onToggle,
  onToggleAll,
  onView,
  onEdit,
  onRole,
  onStatus,
  onDelete,
  onSort,
  loading,
}) {
  const allSelected = users.length > 0 && users.every((user) => selectedIds.includes(user.id));

  if (loading) {
    return (
      <div className="admin-users-table-card">
        <div className="admin-users-skeleton" />
        <div className="admin-users-skeleton" />
        <div className="admin-users-skeleton" />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="admin-users-empty">
        <h2>Aucun utilisateur ne correspond à vos filtres.</h2>
        <p>Essayez de modifier votre recherche ou de réinitialiser les filtres.</p>
      </div>
    );
  }

  return (
    <section className="admin-users-table-card">
      <table className="admin-users-table">
        <thead>
          <tr>
            <th><input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Tout sélectionner" /></th>
            <th><button type="button" onClick={() => onSort("nom")}>Utilisateur</button></th>
            <th><button type="button" onClick={() => onSort("email")}>Email</button></th>
            <th><button type="button" onClick={() => onSort("role")}>Rôle</button></th>
            <th><button type="button" onClick={() => onSort("status")}>Statut</button></th>
            <th><button type="button" onClick={() => onSort("createdAt")}>Inscription</button></th>
            <th><button type="button" onClick={() => onSort("lastLoginAt")}>Dernière connexion</button></th>
            <th>Formations</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} onDoubleClick={() => onView(user)}>
              <td><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => onToggle(user.id)} aria-label={`Sélectionner ${user.nom}`} /></td>
              <td>
                <button type="button" className="admin-users-person" onClick={() => onView(user)}>
                  <span className="admin-users-avatar"><Avatar user={user} /></span>
                  <span><strong>{user.nom}</strong><small>#{user.id}</small></span>
                </button>
              </td>
              <td>{user.email}</td>
              <td><UserRoleBadge role={user.role} /></td>
              <td><UserStatusBadge status={user.status} /></td>
              <td>{formatDate(user.createdAt)}</td>
              <td>{formatDate(user.lastLoginAt)}</td>
              <td>{user.formationsCount ?? 0}</td>
              <td>
                <div className="admin-users-row-actions">
                  <button type="button" title="Voir le profil" onClick={() => onView(user)}><FontAwesomeIcon icon={faEye} /></button>
                  <button type="button" title="Modifier" onClick={() => onEdit(user)}><FontAwesomeIcon icon={faPen} /></button>
                  <button type="button" title="Changer le rôle" onClick={() => onRole(user)}><FontAwesomeIcon icon={faUserShield} /></button>
                  <button type="button" title={user.status === "actif" ? "Désactiver" : "Activer"} onClick={() => onStatus(user)}><FontAwesomeIcon icon={faPowerOff} /></button>
                  <button type="button" title="Archiver" className="danger" onClick={() => onDelete(user)}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default UsersTable;

