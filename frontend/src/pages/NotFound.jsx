import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompass } from "@fortawesome/free-solid-svg-icons";
import PublicNavbar from "../components/PublicNavbar";
import "../styles/ui-system.css";

function NotFound() {
  return (
    <div className="not-found-page">
      <PublicNavbar
        menuItems={[
          { label: "Accueil", to: "/" },
          { label: "Formations", to: "/formations" },
          { label: "Contact", href: "#footer" },
        ]}
      />
      <main className="not-found-shell">
        <div className="not-found-card">
          <span className="not-found-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCompass} />
          </span>
          <p className="not-found-kicker">Erreur 404</p>
          <h1>Page introuvable</h1>
          <p>
            Cette page n’existe pas. Retournez vers l’accueil
            ou explorez les formations SkillHub.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn-create">Retour à l’accueil</Link>
            <Link to="/formations" className="btn-secondary">Voir les formations</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NotFound;
