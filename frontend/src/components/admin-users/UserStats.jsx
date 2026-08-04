import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardUser, faGraduationCap, faUserSlash, faUsers } from "@fortawesome/free-solid-svg-icons";

const cards = [
  { key: "total", label: "Utilisateurs", icon: faUsers },
  { key: "apprenants", label: "Apprenants", icon: faGraduationCap },
  { key: "formateurs", label: "Formateurs", icon: faChalkboardUser },
  { key: "desactives", label: "Comptes désactivés", icon: faUserSlash },
];

function UserStats({ stats, loading }) {
  return (
    <section className="admin-users-stats" aria-label="Statistiques utilisateurs">
      {cards.map((card) => (
        <article className="admin-users-stat-card" key={card.key}>
          <span><FontAwesomeIcon icon={card.icon} /></span>
          <div>
            <strong>{loading ? "…" : stats?.[card.key] ?? 0}</strong>
            <p>{card.label}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

export default UserStats;

