import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faKey, faUser } from "@fortawesome/free-solid-svg-icons";
import { connecter, inscrire } from "../services/authApi";
import { sauvegarderSession, supprimerSession } from "../services/auth";
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

function validerFormulaire({ mode, nom, email, motDePasse, confirmation }) {
  if (!EMAIL_VALIDE.test(email)) {
    return "Veuillez saisir une adresse e-mail valide.";
  }

  if (mode !== "inscription") {
    return "";
  }

  if (nom.trim().length < 3) {
    return "Le nom doit contenir au moins 3 caractères.";
  }

  if (!MOT_DE_PASSE_VALIDE.test(motDePasse)) {
    return "Le mot de passe doit contenir 8 caractères, une majuscule, un chiffre et un caractère spécial.";
  }

  if (motDePasse !== confirmation) {
    return "Les mots de passe ne correspondent pas.";
  }

  return "";
}

function destinationApresConnexion(utilisateur) {
  if (utilisateur?.role === "administrateur" || utilisateur?.role === "admin") {
    return "/admin/utilisateurs";
  }
  return utilisateur?.role === "formateur" ? "/dashboard/formateur" : "/dashboard/apprenant";
}

function AuthTabs({ mode, onChange }) {
  return (
    <div className="auth-modal-tabs" role="tablist" aria-label="Authentification">
      <button type="button" className={mode === "inscription" ? "active" : ""} onClick={() => onChange("inscription")} role="tab" aria-selected={mode === "inscription"}>S'inscrire</button>
      <button type="button" className={mode === "connexion" ? "active" : ""} onClick={() => onChange("connexion")} role="tab" aria-selected={mode === "connexion"}>Se connecter</button>
    </div>
  );
}

AuthTabs.propTypes = {
  mode: PropTypes.oneOf(["connexion", "inscription"]).isRequired,
  onChange: PropTypes.func.isRequired,
};

function AuthHeading({ mode }) {
  const connexion = mode === "connexion";

  return (
    <header className="auth-modal-heading">
      <h1 id="auth-modal-title">{connexion ? "Bienvenue" : "Créer un compte"}</h1>
      <p>{connexion ? "Accédez à votre espace SkillHub." : "Rejoignez SkillHub en quelques instants."}</p>
    </header>
  );
}

AuthHeading.propTypes = {
  mode: PropTypes.oneOf(["connexion", "inscription"]).isRequired,
};

function PasswordStrength({ forceMotDePasse }) {
  return (
    <div className={`auth-password-strength auth-password-strength--${forceMotDePasse.classe}`} aria-live="polite">
      <div className="auth-password-strength-track">
        <span style={{ width: `${forceMotDePasse.score * 25}%` }} />
      </div>
      <p>Force du mot de passe : <strong>{forceMotDePasse.label}</strong></p>
    </div>
  );
}

PasswordStrength.propTypes = {
  forceMotDePasse: PropTypes.shape({
    score: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    classe: PropTypes.string.isRequired,
  }).isRequired,
};

function PasswordMatch({ confirmationSaisie, motsDePasseIdentiques }) {
  const classe = confirmationSaisie ? (motsDePasseIdentiques ? "is-valid" : "is-invalid") : "";
  const message = confirmationSaisie
    ? (motsDePasseIdentiques ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas.")
    : "Confirmez le mot de passe.";

  return <p className={`auth-password-match ${classe}`}>{message}</p>;
}

PasswordMatch.propTypes = {
  confirmationSaisie: PropTypes.bool.isRequired,
  motsDePasseIdentiques: PropTypes.bool.isRequired,
};

function PasswordField({ mode, motDePasse, setMotDePasse, motDePasseVisible, setMotDePasseVisible }) {
  return (
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
  );
}

PasswordField.propTypes = {
  mode: PropTypes.oneOf(["connexion", "inscription"]).isRequired,
  motDePasse: PropTypes.string.isRequired,
  setMotDePasse: PropTypes.func.isRequired,
  motDePasseVisible: PropTypes.bool.isRequired,
  setMotDePasseVisible: PropTypes.func.isRequired,
};

function AuthFields({
  mode,
  nom,
  setNom,
  email,
  setEmail,
  motDePasse,
  setMotDePasse,
  confirmation,
  setConfirmation,
  role,
  setRole,
  motDePasseVisible,
  setMotDePasseVisible,
  forceMotDePasse,
  motsDePasseIdentiques,
  confirmationSaisie,
}) {
  const inscription = mode === "inscription";

  return (
    <>
      {inscription && (
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

      <PasswordField
        mode={mode}
        motDePasse={motDePasse}
        setMotDePasse={setMotDePasse}
        motDePasseVisible={motDePasseVisible}
        setMotDePasseVisible={setMotDePasseVisible}
      />

      {inscription && <PasswordStrength forceMotDePasse={forceMotDePasse} />}

      {inscription && (
        <>
          <label className="auth-modal-field">
            <span className="auth-modal-field-label">Confirmer le mot de passe</span>
            <span className="auth-modal-input-wrap">
              <FontAwesomeIcon icon={faKey} aria-hidden="true" />
              <input type={motDePasseVisible ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" placeholder="Confirmez le mot de passe" required />
            </span>
          </label>
          <PasswordMatch confirmationSaisie={confirmationSaisie} motsDePasseIdentiques={motsDePasseIdentiques} />
          <fieldset className="auth-modal-roles">
            <legend>Je suis</legend>
            <label className={role === "apprenant" ? "active" : ""}><input type="radio" name="modal-role" value="apprenant" checked={role === "apprenant"} onChange={(event) => setRole(event.target.value)} />Apprenant</label>
            <label className={role === "formateur" ? "active" : ""}><input type="radio" name="modal-role" value="formateur" checked={role === "formateur"} onChange={(event) => setRole(event.target.value)} />Formateur</label>
          </fieldset>
        </>
      )}
    </>
  );
}

AuthFields.propTypes = {
  mode: PropTypes.oneOf(["connexion", "inscription"]).isRequired,
  nom: PropTypes.string.isRequired,
  setNom: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  motDePasse: PropTypes.string.isRequired,
  setMotDePasse: PropTypes.func.isRequired,
  confirmation: PropTypes.string.isRequired,
  setConfirmation: PropTypes.func.isRequired,
  role: PropTypes.string.isRequired,
  setRole: PropTypes.func.isRequired,
  motDePasseVisible: PropTypes.bool.isRequired,
  setMotDePasseVisible: PropTypes.func.isRequired,
  forceMotDePasse: PasswordStrength.propTypes.forceMotDePasse,
  motsDePasseIdentiques: PropTypes.bool.isRequired,
  confirmationSaisie: PropTypes.bool.isRequired,
};

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
    navigate(destinationApresConnexion(donnees.utilisateur), { replace: true });
  };

  const soumettre = async (event) => {
    event.preventDefault();
    if (chargement) return;
    setErreur("");

    const emailNormalise = email.trim().toLowerCase();
    const erreurValidation = validerFormulaire({ mode, nom, email: emailNormalise, motDePasse, confirmation });
    if (erreurValidation) {
      setErreur(erreurValidation);
      return;
    }

    setChargement(true);
    try {
      supprimerSession();
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
          <AuthTabs mode={mode} onChange={changerMode} />
          <AuthHeading mode={mode} />

          <form className="auth-modal-form" onSubmit={soumettre} noValidate>
            <AuthFields
              mode={mode}
              nom={nom}
              setNom={setNom}
              email={email}
              setEmail={setEmail}
              motDePasse={motDePasse}
              setMotDePasse={setMotDePasse}
              confirmation={confirmation}
              setConfirmation={setConfirmation}
              role={role}
              setRole={setRole}
              motDePasseVisible={motDePasseVisible}
              setMotDePasseVisible={setMotDePasseVisible}
              forceMotDePasse={forceMotDePasse}
              motsDePasseIdentiques={motsDePasseIdentiques}
              confirmationSaisie={confirmationSaisie}
            />

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
