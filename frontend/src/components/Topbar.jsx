import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBell, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import profile from "../assets/profile.jpg";
import { deconnecter } from "../services/authApi";
import { recupererUtilisateur, supprimerSession } from "../services/auth";
import "../styles/topbar.css";

function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const utilisateur = recupererUtilisateur();
  const routeDashboard = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/dashboard/formateur";
  const nomUtilisateur = utilisateur?.nom || "Utilisateur";
  const [theme, setTheme] = useState("light");
  const afficherBoutonRetour = !["/dashboard/formateur", "/dashboard/apprenant"].includes(location.pathname);

  useEffect(() => {
    const themeSauvegarde = localStorage.getItem("theme-dashboard");
    const themeInitial = themeSauvegarde === "dark" ? "dark" : "light";

    setTheme(themeInitial);
    document.documentElement.setAttribute("data-theme", themeInitial);
  }, []);

  const basculerTheme = () => {
    const prochainTheme = theme === "dark" ? "light" : "dark";
    setTheme(prochainTheme);
    localStorage.setItem("theme-dashboard", prochainTheme);
    document.documentElement.setAttribute("data-theme", prochainTheme);
  };

  const gererRetour = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routeDashboard, { replace: true });
  };

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
    <header className="topbar">
      <div className="topbar_gauche">
        <h1 className="welcome">Bienvenue, {nomUtilisateur} !</h1>
        {afficherBoutonRetour && (
          <button type="button" className="back_btn" onClick={gererRetour}>
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            <span>Retour</span>
          </button>
        )}
      </div>

      <div className="profile_section">
        <button
          type="button"
          className="theme_btn"
          onClick={basculerTheme}
          aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} aria-hidden="true" />
          <span>{theme === "dark" ? "Clair" : "Sombre"}</span>
        </button>

        <FontAwesomeIcon
          icon={faBell}
          aria-label="Notifications"
        />

        <img
          src={profile}
          alt="Photo de profil"
          className="photo_profil"
          width="40"
          height="40"
        />

        <button type="button" className="logout_btn" onClick={gererDeconnexion}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}

export default Topbar;
