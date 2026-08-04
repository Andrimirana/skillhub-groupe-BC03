import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

function UserFilters({ filters, onChange, onReset, disabled }) {
  const update = (key, value) => onChange({ ...filters, [key]: value, page: 0 });

  return (
    <section className="admin-users-filters" aria-label="Recherche et filtres">
      <label className="admin-users-search">
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        <input
          type="search"
          value={filters.search}
          placeholder="Rechercher par nom, email ou identifiant"
          onChange={(event) => update("search", event.target.value)}
          disabled={disabled}
        />
      </label>
      <select value={filters.role} onChange={(event) => update("role", event.target.value)} disabled={disabled} aria-label="Filtrer par rôle">
        <option value="tous">Tous les rôles</option>
        <option value="administrateur">Administrateur</option>
        <option value="formateur">Formateur</option>
        <option value="apprenant">Apprenant</option>
      </select>
      <select value={filters.status} onChange={(event) => update("status", event.target.value)} disabled={disabled} aria-label="Filtrer par statut">
        <option value="tous">Tous les statuts</option>
        <option value="actif">Actif</option>
        <option value="desactive">Désactivé</option>
        <option value="en_attente">En attente</option>
        <option value="suspendu">Suspendu</option>
      </select>
      <select value={filters.period} onChange={(event) => update("period", event.target.value)} disabled={disabled} aria-label="Filtrer par date">
        <option value="toutes">Toutes les dates</option>
        <option value="aujourdhui">Aujourd’hui</option>
        <option value="semaine">Cette semaine</option>
        <option value="mois">Ce mois-ci</option>
      </select>
      <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={onReset} disabled={disabled}>
        <FontAwesomeIcon icon={faRotateLeft} />
        Réinitialiser
      </button>
    </section>
  );
}

export default UserFilters;

