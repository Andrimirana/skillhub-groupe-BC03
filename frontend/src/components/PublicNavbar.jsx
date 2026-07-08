import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBookOpen,
  faGaugeHigh,
  faMoon,
  faSun,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import { appliquerTheme, recupererTheme } from "../services/theme";
import AuthModal from "./AuthModal";
import "../styles/public-navbar.css";

function PublicNavbar({ menuItems = [] }) {
  const navigate = useNavigate();
  const utilisateur = recupererUtilisateur();
  const routeDashboard = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [theme, setTheme] = useState(recupererTheme);

  const basculerTheme = () => {
    const prochainTheme = theme === "dark" ? "light" : "dark";
    setTheme(prochainTheme);
    appliquerTheme(prochainTheme);
  };

  useEffect(() => {
    appliquerTheme(theme);
  }, [theme]);

  const gererDeconnexion = async () => {
    try {
      await deconnecter();
    } catch { /* ignore */ } finally {
      supprimerSession();
      navigate("/", { replace: true });
    }
  };

  const fermerMenu = () => setMenuOuvert(false);
  const fermerAuthModal = () => setAuthModal(null);
  const ouvrirAuthModal = (mode) => {
    setMenuOuvert(false);
    setAuthModal(mode);
  };

  return (
    <>
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
            {!utilisateur && (
              <>
                <button type="button" className="public-navbar-btn login-btn" onClick={() => ouvrirAuthModal("connexion")}>
                  Se connecter
                </button>
                <button type="button" className="public-navbar-btn signup-btn" onClick={() => ouvrirAuthModal("inscription")}>
                  S'inscrire
                </button>
              </>
            )}

            <button
              type="button"
              className="public-navbar-btn theme-btn"
              onClick={basculerTheme}
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} aria-hidden="true" />
            </button>

            {utilisateur && (
              <button
                type="button"
                className="public-navbar-profile"
                aria-label="Ouvrir mon profil"
                title={utilisateur.nom || utilisateur.email || "Mon profil"}
                onClick={() => setMenuProfilOuvert((etat) => !etat)}
                aria-expanded={menuProfilOuvert}
              >
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              </button>
            )}

            {utilisateur && menuProfilOuvert && (
              <div className="public-profile-menu" role="dialog" aria-label="Menu profil">
                <div className="public-profile-head">
                  <span className="public-profile-avatar"><FontAwesomeIcon icon={faUser} /></span>
                  <div>
                    <strong>{utilisateur.nom || "Utilisateur SkillHub"}</strong>
                    <p>{utilisateur.email || "Compte SkillHub"}</p>
                  </div>
                </div>
                <Link to={routeDashboard} onClick={() => setMenuProfilOuvert(false)}>
                  <FontAwesomeIcon icon={faGaugeHigh} /> Dashboard
                </Link>
                <Link to="/mes-ateliers" onClick={() => setMenuProfilOuvert(false)}>
                  <FontAwesomeIcon icon={faBookOpen} /> Mes formations
                </Link>
                <Link to="/profil" onClick={() => setMenuProfilOuvert(false)}>
                  <FontAwesomeIcon icon={faUser} /> Mon profil
                </Link>
                <button type="button" onClick={gererDeconnexion} className="public-profile-logout">
                  <FontAwesomeIcon icon={faArrowRightFromBracket} /> Déconnexion
                </button>
              </div>
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
      {authModal && <AuthModal modeInitial={authModal} onClose={fermerAuthModal} />}
    </>
  );
}

export default PublicNavbar;
