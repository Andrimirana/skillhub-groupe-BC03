import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faKey, faUser } from "@fortawesome/free-solid-svg-icons";
import { connecter, inscrire } from "../services/authApi";
import { sauvegarderSession } from "../services/auth";
import "../styles/auth-modal.css";

const EMAIL_VALIDE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const MOT_DE_PASSE_VALIDE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function analyserForceMotDePasse(valeur) {
  let score = 0;
  if (valeur.length >= 8) score += 1;
  if (/[A-Z]/.test(valeur)) score += 1;
  if (/\d/.test(valeur)) score += 1;
  if (/[^A-Za-z0-9]/.test(valeur)) score += 1;

  if (!valeur) return { score: 0, label: "Mot de passe requis", classe: "empty" };
  if (score <= 1) return { score, label: "Faible", classe: "weak" };
  if (score <= 3) return { score, label: "Moyen", classe: "medium" };
  return { score, label: "Fort", classe: "strong" };
}

function AuthModal({ modeInitial, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(modeInitial);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [role, setRole] = useState("apprenant");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const forceMotDePasse = analyserForceMotDePasse(motDePasse);
  const motsDePasseIdentiques = confirmation.length > 0 && motDePasse === confirmation;
  const confirmationSaisie = confirmation.length > 0;

  useEffect(() => {
    setMode(modeInitial);
    setErreur("");
  }, [modeInitial]);

  useEffect(() => {
    const gererClavier = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", gererClavier);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", gererClavier);
    };
  }, [onClose]);

  const changerMode = (nouveauMode) => {
    setMode(nouveauMode);
    setErreur("");
  };

  const terminerAuthentification = (donnees) => {
    sauvegarderSession(donnees.token, donnees.utilisateur);
    onClose();
    if (onSuccess) {
      onSuccess(donnees);
      return;
    }
    const destination = donnees.utilisateur?.role === "formateur"
      ? "/dashboard/formateur"
      : "/dashboard/apprenant";
    navigate(destination, { replace: true });
  };

  const soumettre = async (event) => {
    event.preventDefault();
    if (chargement) return;
    setErreur("");

    const emailNormalise = email.trim().toLowerCase();
    if (!EMAIL_VALIDE.test(emailNormalise)) {
      setErreur("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (mode === "inscription") {
      if (nom.trim().length < 3) {
        setErreur("Le nom doit contenir au moins 3 caractères.");
        return;
      }
      if (!MOT_DE_PASSE_VALIDE.test(motDePasse)) {
        setErreur("Le mot de passe doit contenir 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        return;
      }
      if (motDePasse !== confirmation) {
        setErreur("Les mots de passe ne correspondent pas.");
        return;
      }
    }

    setChargement(true);
    try {
      const donnees = mode === "connexion"
        ? await connecter(emailNormalise, motDePasse)
        : await inscrire(nom.trim(), emailNormalise, motDePasse, role);
      terminerAuthentification(donnees);
    } catch (error) {
      setErreur(error.response?.data?.message || `${mode === "connexion" ? "Connexion" : "Inscription"} impossible.`);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="auth-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`auth-modal auth-modal--${mode}`} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Fermer">×</button>

        <aside className="auth-modal-visual">
          <div className="auth-modal-image-wrap">
            <img src="/assets/images/learning/skillhub-auth.png" alt="Apprendre et progresser avec SkillHub" />
          </div>
        </aside>

        <div className="auth-modal-content">
          <div className="auth-modal-tabs" role="tablist" aria-label="Authentification">
            <button type="button" className={mode === "inscription" ? "active" : ""} onClick={() => changerMode("inscription")} role="tab" aria-selected={mode === "inscription"}>S'inscrire</button>
            <button type="button" className={mode === "connexion" ? "active" : ""} onClick={() => changerMode("connexion")} role="tab" aria-selected={mode === "connexion"}>Se connecter</button>
          </div>

          <header className="auth-modal-heading">
            <h1 id="auth-modal-title">{mode === "connexion" ? "Bienvenue" : "Créer un compte"}</h1>
            <p>{mode === "connexion" ? "Accédez à votre espace SkillHub." : "Rejoignez SkillHub en quelques instants."}</p>
          </header>

          <form className="auth-modal-form" onSubmit={soumettre} noValidate>
            {mode === "inscription" && (
              <label className="auth-modal-field">
                <span className="auth-modal-field-label">Nom complet</span>
                <span className="auth-modal-input-wrap">
                  <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  <input value={nom} onChange={(event) => setNom(event.target.value)} autoComplete="name" placeholder="Votre nom" required />
                </span>
              </label>
            )}

            <label className="auth-modal-field">
              <span className="auth-modal-field-label">Adresse e-mail</span>
              <span className="auth-modal-input-wrap">
                <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value.replace(/\s/g, ""))} autoComplete="email" placeholder="vous@exemple.com" required />
              </span>
            </label>

            <label className="auth-modal-field">
              <span className="auth-modal-field-label">Mot de passe</span>
              <span className="auth-modal-input-wrap auth-modal-password">
                <FontAwesomeIcon icon={faKey} aria-hidden="true" />
                <input type={motDePasseVisible ? "text" : "password"} value={motDePasse} onChange={(event) => setMotDePasse(event.target.value)} autoComplete={mode === "connexion" ? "current-password" : "new-password"} placeholder="Votre mot de passe" required />
                <button type="button" onClick={() => setMotDePasseVisible((visible) => !visible)} aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  <FontAwesomeIcon icon={motDePasseVisible ? faEyeSlash : faEye} aria-hidden="true" />
                </button>
              </span>
            </label>

            {mode === "inscription" && (
              <div className={`auth-password-strength auth-password-strength--${forceMotDePasse.classe}`} aria-live="polite">
                <div className="auth-password-strength-track">
                  <span style={{ width: `${Math.max(forceMotDePasse.score, motDePasse ? 1 : 0) * 25}%` }} />
                </div>
                <p>Force du mot de passe : <strong>{forceMotDePasse.label}</strong></p>
              </div>
            )}

            {mode === "inscription" && (
              <>
                <label className="auth-modal-field">
                  <span className="auth-modal-field-label">Confirmer le mot de passe</span>
                  <span className="auth-modal-input-wrap">
                    <FontAwesomeIcon icon={faKey} aria-hidden="true" />
                    <input type={motDePasseVisible ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" placeholder="Confirmez le mot de passe" required />
                  </span>
                </label>
                <p className={`auth-password-match ${confirmationSaisie ? (motsDePasseIdentiques ? "is-valid" : "is-invalid") : ""}`}>
                  {confirmationSaisie
                    ? (motsDePasseIdentiques ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas.")
                    : "Confirmez le mot de passe."}
                </p>
                <fieldset className="auth-modal-roles">
                  <legend>Je suis</legend>
                  <label className={role === "apprenant" ? "active" : ""}><input type="radio" name="modal-role" value="apprenant" checked={role === "apprenant"} onChange={(event) => setRole(event.target.value)} />Apprenant</label>
                  <label className={role === "formateur" ? "active" : ""}><input type="radio" name="modal-role" value="formateur" checked={role === "formateur"} onChange={(event) => setRole(event.target.value)} />Formateur</label>
                </fieldset>
              </>
            )}

            {erreur && <p className="auth-modal-error" role="alert">{erreur}</p>}

            <button type="submit" className="auth-modal-submit" disabled={chargement}>
              {chargement ? "Veuillez patienter..." : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

        </div>
      </section>
    </div>
  );
}

AuthModal.propTypes = {
  modeInitial: PropTypes.oneOf(["connexion", "inscription"]).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

AuthModal.defaultProps = {
  onSuccess: null,
};

export default AuthModal;
