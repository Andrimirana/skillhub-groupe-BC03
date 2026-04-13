import logo from "../assets/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faCog, faFileLines, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import "../styles/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const utilisateur = recupererUtilisateur();
  const routeTableauDeBord = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
  const urlSwagger = import.meta.env.VITE_URL_SWAGGER || "http://127.0.0.1:8000/swagger.html";

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch {
    } finally {
      supprimerSession();
      navigate("/connexion", { replace: true });
    }
  };

  return (
    <aside className="sidebar" aria-label="Menu principal">
      <div className="sidebar_logo">
        <img
          src={logo}
          alt="Logo SkillHub"
          className="logo"
          loading="lazy"
        />
      </div>

      <ul className="menu-top">
        <li>
          <Link
            to={routeTableauDeBord}
            className={`sidebar-item ${location.pathname === routeTableauDeBord ? "active" : ""}`}
          >
            <FontAwesomeIcon icon={faBook} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </li>

        <li>
          <a
            className="sidebar-item"
            href={urlSwagger}
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
            <span>Documentation API</span>
          </a>
        </li>

        <li>
          <Link
            to="/mes-ateliers"
            className={`sidebar-item ${location.pathname === "/mes-ateliers" ? "active" : ""}`}
          >
            <FontAwesomeIcon icon={faBook} aria-hidden="true" />
            <span>Mes ateliers</span>
          </Link>
        </li>
      </ul>

      <ul className="menu-bottom">
        <li className="sidebar-item">
          <FontAwesomeIcon icon={faCog} aria-hidden="true" />
          <span>Paramètres</span>
        </li>

        <li className="sidebar-item">
          <button type="button" className="sidebar-btn" onClick={gererDeconnexion}>
            <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
