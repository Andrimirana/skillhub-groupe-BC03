import { useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBriefcase,
  faEnvelope,
  faGlobe,
  faGraduationCap,
  faLanguage,
  faPen,
  faPlus,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { mettreAJourUtilisateurSession, recupererUtilisateur } from "../services/auth";
import "../styles/profilePanel.css";

function ProfilePanel({ formationsCount, titleId }) {
  const utilisateurInitial = recupererUtilisateur() || {};
  const [utilisateur, setUtilisateur] = useState(utilisateurInitial);
  const [edition, setEdition] = useState(false);
  const [formulaire, setFormulaire] = useState({
    nom: utilisateurInitial.nom || "",
    email: utilisateurInitial.email || "",
    motDePasse: "",
  });
  const [message, setMessage] = useState("");

  const role = utilisateur.role === "formateur" ? "Formateur" : "Apprenant";
  const libelleFormations = utilisateur.role === "formateur" ? "Formations créées" : "Formations suivies";
  const progressionProfil = Math.min(100, 35 + (utilisateur.nom ? 20 : 0) + (utilisateur.email ? 20 : 0) + (formationsCount > 0 ? 25 : 0));

  const ouvrirEdition = () => {
    setFormulaire({
      nom: utilisateur.nom || "",
      email: utilisateur.email || "",
      motDePasse: "",
    });
    setEdition(true);
  };

  const fermerEdition = () => {
    setEdition(false);
    setFormulaire((etat) => ({ ...etat, motDePasse: "" }));
  };

  const gererChangement = (champ, valeur) => {
    setFormulaire((etat) => ({ ...etat, [champ]: valeur }));
  };

  const gererEnregistrement = (event) => {
    event.preventDefault();
    const misAJour = mettreAJourUtilisateurSession({
      nom: formulaire.nom.trim() || utilisateur.nom,
      email: formulaire.email.trim() || utilisateur.email,
    });

    if (misAJour) {
      setUtilisateur(misAJour);
    }

    setFormulaire((etat) => ({ ...etat, motDePasse: "" }));
    setEdition(false);
    setMessage(
      formulaire.motDePasse
        ? "Profil mis à jour. Le changement de mot de passe sera synchronisé quand l’API profil sera disponible."
        : "Profil mis à jour.",
    );
  };

  return (
    <div className="profile-layout">
      <section className="profile-hero-card" aria-labelledby={titleId}>
        <div className="profile-cover" />
        <div className="profile-hero-content">
          <div className="profile-avatar" aria-hidden="true">
            <FontAwesomeIcon icon={faUser} />
          </div>

          <div className="profile-main-info">
            <p className="profile-kicker">Profil SkillHub</p>
            <h1 id={titleId}>
              {utilisateur.nom || "Utilisateur SkillHub"}
              <span>{role}</span>
            </h1>
            <div className="profile-inline-meta">
              <span><FontAwesomeIcon icon={faEnvelope} /> {utilisateur.email || "email non renseigné"}</span>
              <span><FontAwesomeIcon icon={faGlobe} /> Mauritius</span>
              <span><FontAwesomeIcon icon={faLanguage} /> Français</span>
            </div>
            <button type="button" className="profile-edit-btn" onClick={ouvrirEdition}>
              <FontAwesomeIcon icon={faPen} />
              Modifier mon profil
            </button>
          </div>

          <aside className="profile-completion">
            <div className="profile-completion-head">
              <strong>Profil public</strong>
              <span>Actif</span>
            </div>
            <p>Complétez vos informations pour rendre votre profil plus clair et professionnel.</p>
            <div className="profile-completion-row">
              <span>Complété</span>
              <strong>{progressionProfil}%</strong>
            </div>
            <div className="profile-progress">
              <div style={{ width: `${progressionProfil}%` }} />
            </div>
          </aside>
        </div>
      </section>

      {message && <p className="profile-message">{message}</p>}

      <div className="profile-sections-grid">
        <article className="profile-info-card">
          <header>
            <FontAwesomeIcon icon={faGraduationCap} />
            <h2>{libelleFormations}</h2>
          </header>
          <strong>{formationsCount}</strong>
          <p>{formationsCount > 0 ? "Continuez votre progression et gardez vos acquis visibles." : "Commencez une formation pour enrichir votre profil."}</p>
        </article>

        <article className="profile-info-card profile-info-card--wide">
          <header>
            <FontAwesomeIcon icon={faBriefcase} />
            <h2>Expérience et objectifs</h2>
          </header>
          <p>Ajoutez vos objectifs, votre parcours et les compétences que vous souhaitez développer avec SkillHub.</p>
          <button type="button" className="profile-light-btn">
            <FontAwesomeIcon icon={faPlus} />
            Ajouter une introduction
          </button>
        </article>

        <article className="profile-info-card">
          <header>
            <FontAwesomeIcon icon={faBookOpen} />
            <h2>Compétences</h2>
          </header>
          <p>Vos compétences apparaîtront ici au fil des formations suivies.</p>
          <div className="profile-skill-tags">
            <span>Apprentissage</span>
            <span>Collaboration</span>
            <span>{role}</span>
          </div>
        </article>

        <article className="profile-info-card">
          <header>
            <FontAwesomeIcon icon={faShieldHalved} />
            <h2>Compte</h2>
          </header>
          <p>Email, rôle et sécurité de votre compte sont centralisés dans cette page.</p>
        </article>
      </div>

      {edition && (
        <div className="profile-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && fermerEdition()}>
          <section className="profile-modal profile-modal--simple" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <button type="button" className="profile-modal-close profile-modal-close--plain" onClick={fermerEdition} aria-label="Fermer">
              <span aria-hidden="true">{"\u00d7"}</span>
            </button>

            <h2 id="profile-modal-title" className="profile-simple-title">Modifier le profil</h2>

            <form className="profile-simple-form" onSubmit={gererEnregistrement}>
              <label>
                Nom
                <input
                  type="text"
                  value={formulaire.nom}
                  onChange={(event) => gererChangement("nom", event.target.value)}
                  placeholder="Votre nom"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={formulaire.email}
                  onChange={(event) => gererChangement("email", event.target.value)}
                  placeholder="votre@email.com"
                />
              </label>

              <label>
                Mot de passe
                <input
                  type="password"
                  value={formulaire.motDePasse}
                  onChange={(event) => gererChangement("motDePasse", event.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </label>

              <div className="profile-simple-actions">
                <button type="button" className="profile-cancel-btn" onClick={fermerEdition}>Annuler</button>
                <button type="submit" className="profile-save-btn">Enregistrer</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

ProfilePanel.propTypes = {
  formationsCount: PropTypes.number.isRequired,
  titleId: PropTypes.string,
};

ProfilePanel.defaultProps = {
  titleId: "profile-panel-title",
};

export default ProfilePanel;
