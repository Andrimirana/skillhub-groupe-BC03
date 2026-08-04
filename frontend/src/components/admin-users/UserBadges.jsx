const ROLE_LABELS = {
  administrateur: "Administrateur",
  admin: "Administrateur",
  formateur: "Formateur",
  apprenant: "Apprenant",
};

const STATUS_LABELS = {
  actif: "Actif",
  desactive: "Désactivé",
  en_attente: "En attente",
  suspendu: "Suspendu",
  supprime: "Archivé",
};

export function UserRoleBadge({ role }) {
  const value = role || "apprenant";
  return <span className={`admin-users-badge admin-users-badge--role-${value}`}>{ROLE_LABELS[value] || value}</span>;
}

export function UserStatusBadge({ status }) {
  const value = status || "actif";
  return <span className={`admin-users-badge admin-users-badge--status-${value}`}>{STATUS_LABELS[value] || value}</span>;
}

