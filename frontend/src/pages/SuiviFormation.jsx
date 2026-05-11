import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle, faClock, faStar, faDownload, faFileAlt, faQuestionCircle, faMedal, faShare } from "@fortawesome/free-solid-svg-icons";
import { listerFormationsApprenant } from "../services/formationsApi";
import "../styles/suiviFormation.css";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";

// Composant page de suivi de formation
function SuiviFormation() {
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [modulesCompletes, setModulesCompletes] = useState({});
  const [noteEvaluation, setNoteEvaluation] = useState(0);
  const [ressourcesOuvertes, setRessourcesOuvertes] = useState({});
  const [afficherCertificat, setAfficherCertificat] = useState(false);

  // Charge la formation au montage
  useEffect(() => {
    const charger = async () => {
      try {
        setChargement(true);
        const formations = await listerFormationsApprenant();
        const trouvee = formations.find((item) => String(item.id) === String(id));
        setFormation(trouvee || null);
      } finally {
        setChargement(false);
      }
    };

    charger();
  }, [id]);

  const modules = formation?.modules || [];

  // Calcule la progression
  const progressionLocale = useMemo(() => {
    if (modules.length === 0) {
      return formation?.progression ?? 0;
    }
    const completes = modules.filter((m) => modulesCompletes[m.id]).length;
    return Math.round((completes / modules.length) * 100);
  }, [modules, modulesCompletes, formation]);

  // Bascule l'état d'un module
  const basculerModule = (idModule) => {
    setModulesCompletes((etat) => ({ ...etat, [idModule]: !etat[idModule] }));
  };

  // Bascule l'affichage d'une ressource
  const basculerRessource = (indexRessource) => {
    setRessourcesOuvertes((etat) => ({ ...etat, [indexRessource]: !etat[indexRessource] }));
  };

  // Génère un certificat fictif
  const genererCertificat = () => {
    if (progressionLocale === 100) {
      setAfficherCertificat(true);
    }
  };

  if (chargement) {
    return <div className="suivi-loading">Chargement...</div>;
  }

  if (!formation) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Topbar />
          <main className="suivi-error">
            <p>Cette formation n'est pas dans votre espace apprenant.</p>
            <Link to="/dashboard/apprenant" className="btn-create">
              <FontAwesomeIcon icon={faArrowLeft} /> Retour au dashboard
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const nbCompletes = modules.filter((m) => modulesCompletes[m.id]).length;
  const nbTotal = modules.length;
  const tempsEstime = formation.duree || 20;

  // Ressources fictives pour enrichir la page
  const ressources = [
    { titre: "Guide complet.pdf", type: "PDF", taille: "2.5MB", icon: faFileAlt },
    { titre: "Diagrammes et schémas.zip", type: "ZIP", taille: "5.1MB", icon: faDownload },
    { titre: "Code sources exemples.zip", type: "ZIP", taille: "1.8MB", icon: faDownload },
    { titre: "QCM de révision", type: "Quiz", taille: "En ligne", icon: faQuestionCircle },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main className="suivi-main">
          {/* En-tête du suivi */}
          <section className="suivi-hero">
            <div className="suivi-hero-content">
              <Link to="/dashboard/apprenant" className="suivi-retour">
                <FontAwesomeIcon icon={faArrowLeft} /> Retour
              </Link>
              <h1 className="suivi-titre">{formation.titre}</h1>
              <p className="suivi-description">{formation.description}</p>
              <div className="suivi-meta">
                <div className="meta-item">
                  <FontAwesomeIcon icon={faClock} />
                  <span>{tempsEstime}h estimée</span>
                </div>
                <div className="meta-item">
                  <FontAwesomeIcon icon={faStar} />
                  <span>Niveau {formation.level}</span>
                </div>
                <div className="meta-item">
                  <span>Par {formation.formateur || "Formateur"}</span>
                </div>
                <div className="meta-item gratuit">
                  <span style={{fontSize: "1.1em", fontWeight: "bold", color: "#5b3df6"}}>🎓 Gratuit</span>
                </div>
              </div>
            </div>

            {/* Cercle de progression */}
            <div className="suivi-progress-circle">
              <svg viewBox="0 0 150 150" width="150" height="150">
                <circle cx="75" cy="75" r="68" className="progress-circle-bg" />
                <circle
                  cx="75"
                  cy="75"
                  r="68"
                  className="progress-circle-fill"
                  strokeDasharray={`${(progressionLocale / 100) * 427.8} 427.8`}
                  transform="rotate(-90 75 75)"
                />
              </svg>
              <div className="progress-circle-label">
                <span className="progress-percent">{progressionLocale}%</span>
                <span className="progress-text">Complété</span>
              </div>
            </div>
          </section>

          {/* Barre de progression générale */}
          <div className="suivi-progress-bar">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressionLocale}%` }} />
            </div>
            <p className="progress-info">
              {nbCompletes} sur {nbTotal} modules terminés
            </p>
          </div>



          {/* Modules interactifs */}
          <section className="suivi-modules-section">
            <h2 className="section-titre">
              <FontAwesomeIcon icon={faFileAlt} /> Contenu de formation
            </h2>
            <p className="section-desc">
              {nbCompletes === 0 && "Commencez votre apprentissage en cochant les modules ci-dessous."}
              {nbCompletes > 0 && nbCompletes < nbTotal && `Vous êtes ${progressionLocale}% du parcours. Continuez vos efforts !`}
              {nbCompletes === nbTotal && "✨ Vous avez terminé tous les modules !"}
            </p>

            <div className="modules-list">
              {modules.map((module, index) => {
                const fait = Boolean(modulesCompletes[module.id]);
                return (
                  <div key={module.id} className={`module-item ${fait ? "completed" : ""}`}>
                    <div className="module-header">
                      <label className="module-checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={fait}
                          onChange={() => basculerModule(module.id)}
                          aria-label={`Marquer le module ${module.titre} comme terminé`}
                        />
                        <span className="module-checkbox-custom" />
                      </label>
                      <div className="module-info">
                        <div className="module-number">
                          <span>Module {module.ordre || index + 1}</span>
                        </div>
                        <h3 className="module-titre">{module.titre}</h3>
                        <p className="module-contenu">{module.contenu}</p>
                      </div>
                      {fait && <FontAwesomeIcon icon={faCheckCircle} className="module-check-icon" />}
                    </div>
                  </div>
                );
              })}
              {modules.length === 0 && (
                <p className="modules-empty">Cette formation n'a pas encore de modules. Revenez bientôt !</p>
              )}
            </div>
          </section>

          {/* Ressources de la formation */}
          <section className="suivi-ressources-section">
            <h2 className="section-titre">
              <FontAwesomeIcon icon={faDownload} /> Ressources et matériaux
            </h2>
            <div className="ressources-grid">
              {ressources.map((ressource, idx) => (
                <div key={idx} className="ressource-card">
                  <div className="ressource-header">
                    <FontAwesomeIcon icon={ressource.icon} className="ressource-icon" />
                    <span className="ressource-type">{ressource.type}</span>
                  </div>
                  <h4 className="ressource-titre">{ressource.titre}</h4>
                  <p className="ressource-taille">{ressource.taille}</p>
                  <button
                    className="ressource-btn"
                    onClick={() => basculerRessource(idx)}
                  >
                    {ressourcesOuvertes[idx] ? "Télécharger" : "Voir"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Certificat */}
          {progressionLocale === 100 && (
            <section className="suivi-certificat-section">
              <h2 className="section-titre">
                <FontAwesomeIcon icon={faMedal} /> Certificat d'achèvement
              </h2>
              <div className="certificat-card">
                <p className="certificat-text">Félicitations ! Vous avez complété cette formation.</p>
                <button className="btn-create" onClick={genererCertificat}>
                  <FontAwesomeIcon icon={faMedal} /> Télécharger le certificat
                </button>
                <button className="btn-share">
                  <FontAwesomeIcon icon={faShare} /> Partager sur les réseaux
                </button>
              </div>
            </section>
          )}

          {/* Formulaire pour le certificat fictif */}
          {afficherCertificat && (
            <div className="certificat-modal">
              <div className="certificat-overlay" onClick={() => setAfficherCertificat(false)} />
              <div className="certificat-content">
                <h2>Certificat d'achèvement</h2>
                <div className="certificat-body">
                  <p>Ceci certifie que</p>
                  <p className="certificat-nom">John Doe</p>
                  <p>a complété avec succès la formation</p>
                  <p className="certificat-titre">{formation.titre}</p>
                  <p className="certificat-date">Date : {new Date().toLocaleDateString("fr-FR")}</p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => setAfficherCertificat(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SuiviFormation;
