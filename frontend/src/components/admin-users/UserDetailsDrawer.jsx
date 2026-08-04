import { UserRoleBadge, UserStatusBadge } from "./UserBadges";

function UserDetailsDrawer({ user, onClose, onEdit, onStatus, onDelete }) {
  if (!user) return null;

  const profil = user.profil || {};
  const profilItems = Object.entries(profil);

  return (
    <aside className="admin-users-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-user-detail-title">
      <button type="button" className="admin-users-modal-close" onClick={onClose} aria-label="Fermer">×</button>
      <div className="admin-users-drawer-head">
        <span className="admin-users-avatar admin-users-avatar--large">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.nom?.charAt(0)}</span>
        <div>
          <h2 id="admin-user-detail-title">{user.nom}</h2>
          <p>{user.email}</p>
          <div className="admin-users-badges-row">
            <UserRoleBadge role={user.role} />
            <UserStatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <section>
        <h3>Informations générales</h3>
        <dl className="admin-users-detail-list">
          <div><dt>Identifiant</dt><dd>#{user.id}</dd></div>
          <div><dt>Inscription</dt><dd>{user.createdAt || "—"}</dd></div>
          <div><dt>Dernière connexion</dt><dd>{user.lastLoginAt || "—"}</dd></div>
          <div><dt>Email vérifié</dt><dd>{user.emailVerified ? "Oui" : "Non"}</dd></div>
        </dl>
      </section>

      <section>
        <h3>Profil</h3>
        <div className="admin-users-mini-grid">
          {profilItems.length ? profilItems.map(([key, value]) => (
            <article key={key}>
              <strong>{value ?? 0}</strong>
              <span>{key.replace(/([A-Z])/g, " $1")}</span>
            </article>
          )) : <p>Aucune donnée de profil.</p>}
        </div>
      </section>

      <section>
        <h3>Activité récente</h3>
        <ul className="admin-users-activity">
          {(user.activite || []).map((item, index) => (
            <li key={`${item.titre}-${index}`}>
              <strong>{item.titre}</strong>
              <span>{item.date || "—"}</span>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="admin-users-drawer-actions">
        <button type="button" className="admin-users-btn admin-users-btn--primary" onClick={() => onEdit(user)}>Modifier</button>
        <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={() => onStatus(user)}>
          {user.status === "actif" ? "Désactiver" : "Activer"}
        </button>
        <button type="button" className="admin-users-btn admin-users-btn--danger" onClick={() => onDelete(user)}>Archiver</button>
      </div>
    </aside>
  );
}

export default UserDetailsDrawer;

