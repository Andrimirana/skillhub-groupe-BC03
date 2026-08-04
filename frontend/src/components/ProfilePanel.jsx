import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBriefcase,
  faEnvelope,
  faGraduationCap,
  faPen,
  faPlus,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { recupererJeton, recupererUtilisateur, sauvegarderSession } from "../services/auth";
import { modifierProfil, profilConnecte } from "../services/authApi";
import "../styles/profilePanel.css";

function ProfilePanel({ formationsCount, titleId }) {
  const utilisateurInitial = recupererUtilisateur() || {};
  const [utilisateur, setUtilisateur] = useState(utilisateurInitial);
  const [edition, setEdition] = useState(false);
  const [formulaire, setFormulaire] = useState({
    nom: utilisateurInitial.nom || "",
    email: utilisateurInitial.email || "",
    avatarUrl: utilisateurInitial.avatarUrl || utilisateurInitial.avatar_url || "",
  });
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [sauvegarde, setSauvegarde] = useState(false);

  useEffect(() => {
    let actif = true;

    const chargerProfil = async () => {
      try {
        const profil = await profilConnecte();
        if (!actif) return;

        const utilisateurBackend = {
          id: profil.id,
          nom: profil.nom,
          email: profil.email,
          role: profil.role,
          avatarUrl: profil.avatarUrl || profil.avatar_url || "",
        };

        setUtilisateur(utilisateurBackend);
        setFormulaire({
          nom: utilisateurBackend.nom || "",
          email: utilisateurBackend.email || "",
          avatarUrl: utilisateurBackend.avatarUrl || "",
        });

        const jeton = recupererJeton();
        if (jeton) {
          sauvegarderSession(jeton, utilisateurBackend);
        }
      } catch {
        // La route protegee gere deja les sessions invalides.
      }
    };

    chargerProfil();

    return () => {
      actif = false;
    };
  }, []);

  const libelleFormations = utilisateur.role === "formateur" ? "Formations créées" : "Formations suivies";
  const progressionProfil = Math.min(
    100,
    35 + (utilisateur.nom ? 20 : 0) + (utilisateur.email ? 20 : 0) + (formationsCount > 0 ? 25 : 0),
  );

  const ouvrirEdition = () => {
    setFormulaire({
      nom: utilisateur.nom || "",
      email: utilisateur.email || "",
      avatarUrl: utilisateur.avatarUrl || utilisateur.avatar_url || "",
    });
    setErreur("");
    setMessage("");
    setEdition(true);
  };

  const fermerEdition = () => {
    setEdition(false);
    setErreur("");
  };

  const gererChangement = (champ, valeur) => {
    setFormulaire((etat) => ({ ...etat, [champ]: valeur }));
  };

  const gererEnregistrement = async (event) => {
    event.preventDefault();
    setErreur("");
    setMessage("");

    try {
      setSauvegarde(true);
      const reponse = await modifierProfil({
        nom: formulaire.nom.trim(),
        email: formulaire.email.trim(),
        avatarUrl: formulaire.avatarUrl.trim(),
      });

      const profilMisAJour = reponse.utilisateur || {};
      const utilisateurMisAJour = {
        ...profilMisAJour,
        avatarUrl: profilMisAJour.avatarUrl || profilMisAJour.avatar_url || "",
      };
      setUtilisateur(utilisateurMisAJour);
      sauvegarderSession(reponse.token || recupererJeton(), utilisateurMisAJour);
      setEdition(false);
      setMessage("Profil mis à jour dans la base de données.");
    } catch (e) {
      setErreur(e.response?.data?.message || "Impossible de mettre à jour le profil.");
    } finally {
      setSauvegarde(false);
    }
  };

  return (
    <div className="profile-layout">
      <section className="profile-hero-card" aria-labelledby={titleId}>
        <div className="profile-cover" />
        <div className="profile-hero-content">
          <div className="profile-avatar" aria-hidden="true">
            {utilisateur.avatarUrl || utilisateur.avatar_url ? (
              <img src={utilisateur.avatarUrl || utilisateur.avatar_url} alt="" />
            ) : (
              <FontAwesomeIcon icon={faUser} />
            )}
          </div>

          <div className="profile-main-info">
            <h1 id={titleId}>{utilisateur.nom || "Utilisateur SkillHub"}</h1>
            <div className="profile-inline-meta">
              <span><FontAwesomeIcon icon={faEnvelope} /> {utilisateur.email || "email non renseigné"}</span>
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
      {erreur && <p className="error">{erreur}</p>}

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
                Avatar
                <input
                  type="url"
                  value={formulaire.avatarUrl}
                  onChange={(event) => gererChangement("avatarUrl", event.target.value)}
                  placeholder="https://exemple.com/avatar.jpg"
                />
              </label>

              <div className="profile-simple-actions">
                <button type="button" className="profile-cancel-btn" onClick={fermerEdition}>Annuler</button>
                <button type="submit" className="profile-save-btn" disabled={sauvegarde}>
                  {sauvegarde ? "Enregistrement..." : "Enregistrer"}
                </button>
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
