import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import "../styles/public-navbar.css";

function PublicNavbar({ menuItems = [] }) {
  const navigate = useNavigate();
  const utilisateur = recupererUtilisateur();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme-dashboard");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const basculerTheme = () => {
    const prochainTheme = theme === "dark" ? "light" : "dark";
    setTheme(prochainTheme);
    localStorage.setItem("theme-dashboard", prochainTheme);
    document.documentElement.dataset.theme = prochainTheme;
  };

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch { /* ignore */ } finally {
      supprimerSession();
      navigate("/connexion", { replace: true });
    }
  };

  const fermerMenu = () => setMenuOuvert(false);

  return (
    <header className="public-navbar-header">
      <nav className="public-navbar" aria-label="Navigation principale">
        <Link to="/" className="public-navbar-logo" aria-label="Retour à l'accueil" onClick={fermerMenu}>
          <img src={logo} alt="Logo SkillHub" />
        </Link>

        <ul className={`public-navbar-links ${menuOuvert ? "active" : ""}`}>
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.href ? (
                <a href={item.href} onClick={fermerMenu}>
                  {item.label}
                </a>
              ) : (
                <Link to={item.to} onClick={fermerMenu}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="public-navbar-actions">
          {/* Auth buttons - seulement pour les utilisateurs non connectés */}
          {!utilisateur && (
            <>
              <Link to="/connexion" className="public-navbar-btn login-btn">
                Se connecter
              </Link>
              <Link to="/inscription" className="public-navbar-btn signup-btn">
                S'inscrire
              </Link>
            </>
          )}

          {/* Theme button */}
          <button
            type="button"
            className="public-navbar-btn theme-btn"
            onClick={basculerTheme}
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </button>

          {/* Logout button */}
          {utilisateur && (
            <button
              type="button"
              className="public-navbar-btn logout-btn"
              onClick={gererDeconnexion}
              title="Se déconnecter"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          )}
        </div>

        <button
          className={`public-navbar-burger ${menuOuvert ? "active" : ""}`}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOuvert}
          type="button"
          onClick={() => setMenuOuvert(!menuOuvert)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </header>
  );
}

export default PublicNavbar;
