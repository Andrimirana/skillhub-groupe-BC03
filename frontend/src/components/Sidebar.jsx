import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBookOpen,
  faCompass,
  faGrip,
  faPen,
  faPlus,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import "../styles/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const utilisateur = recupererUtilisateur();
  const [repliee, setRepliee] = useState(false);
  const routeTableauDeBord = utilisateur?.role === "administrateur" || utilisateur?.role === "admin"
    ? "/admin/utilisateurs"
    : utilisateur?.role === "apprenant"
      ? "/dashboard/apprenant"
      : "/dashboard/formateur";

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch { /* ignore */ } finally {
      supprimerSession();
      navigate("/", { replace: true });
    }
  };

  const navigationPrincipale = [
    { label: "Dashboard", to: routeTableauDeBord, icon: faGrip },
    ...(utilisateur?.role === "formateur"
      ? [{ label: "Ajouter formation", to: "/creer-atelier", icon: faPlus }]
      : []),
    { label: "Mes formations", to: "/mes-ateliers", icon: faBookOpen },
    { label: "Découvrir", to: "/formations", icon: faCompass },
    { label: "Mon profil", to: "/profil", icon: faUser },
  ];

  const afficherLien = (item) => (
    <li key={item.label}>
      <Link
        to={item.to}
        className={`sidebar-item ${location.pathname === item.to ? "active" : ""}`}
      >
        <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
        <span className="sidebar-title">{item.label}</span>
      </Link>
    </li>
  );

  return (
    <aside className={`sidebar profile-sidebar ${repliee ? "is-collapsed" : ""}`} aria-label="Menu principal">
      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={() => setRepliee((etat) => !etat)}
        aria-label={repliee ? "Déplier le menu" : "Replier le menu"}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <Link to="/profil" className="sidebar-user-card" aria-label="Voir mon profil">
        <span className="sidebar-avatar">
          {utilisateur?.avatarUrl || utilisateur?.avatar_url ? (
            <img src={utilisateur.avatarUrl || utilisateur.avatar_url} alt="" />
          ) : (
            <FontAwesomeIcon icon={faUser} />
          )}
          <span className="sidebar-avatar-edit">
            <FontAwesomeIcon icon={faPen} />
          </span>
        </span>
        <strong>{utilisateur?.nom || "Utilisateur SkillHub"}</strong>
      </Link>

      <nav className="sidebar-nav" aria-label="Navigation dashboard">
        <ul className="menu-top">
          {navigationPrincipale.map(afficherLien)}
        </ul>

        <ul className="menu-bottom">
          <li>
            <button type="button" className="sidebar-item sidebar-btn sidebar-logout" onClick={gererDeconnexion}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="sidebar-icon" />
              <span className="sidebar-title">Déconnexion</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
