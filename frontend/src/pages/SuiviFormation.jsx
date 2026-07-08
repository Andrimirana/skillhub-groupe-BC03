import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCheckCircle,
  faChevronLeft,
  faClock,
  faLayerGroup,
  faPlay,
  faTrophy,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import PublicNavbar from "../components/PublicNavbar";
import { listerFormationsApprenant } from "../services/formationsApi";
import "../styles/suiviFormation.css";

function SuiviFormation() {
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [moduleActif, setModuleActif] = useState(0);
  const [modulesCompletes, setModulesCompletes] = useState({});
  const [modalCoursTermine, setModalCoursTermine] = useState(false);
  const [felicitationAffichee, setFelicitationAffichee] = useState(false);

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

  const modules = useMemo(() => {
    const source = formation?.modules || [];
    if (source.length) return source;
    return [
      { id: "intro", titre: "Introduction", contenu: formation?.description || "Découvrez les objectifs et les bases de cette formation." },
      { id: "practice", titre: "Mise en pratique", contenu: "Passez à la pratique avec des exemples guidés et des étapes simples." },
      { id: "summary", titre: "Résumé du cours", contenu: "Revoyez les points essentiels et préparez la suite de votre parcours." },
    ];
  }, [formation]);

  const moduleCourant = modules[moduleActif] || modules[0];
  const cleModule = (module, index) => String(module?.id ?? module?.titre ?? index);
  const nbCompletes = modules.filter((module, index) => modulesCompletes[cleModule(module, index)]).length;
  const progression = modules.length ? Math.round((nbCompletes / modules.length) * 100) : 0;

  useEffect(() => {
    if (progression === 100 && modules.length > 0 && !felicitationAffichee) {
      setModalCoursTermine(true);
      setFelicitationAffichee(true);
    }
  }, [progression, modules.length, felicitationAffichee]);

  const basculerModule = (idModule) => {
    setModulesCompletes((etat) => ({ ...etat, [idModule]: !etat[idModule] }));
  };

  const allerModule = (index) => {
    setModuleActif(Math.min(Math.max(index, 0), modules.length - 1));
  };

  if (chargement) {
    return <div className="course-player-loading">Chargement...</div>;
  }

  if (!formation) {
    return (
      <main className="course-player-error">
        <p>Cette formation n'est pas dans votre espace apprenant.</p>
        <Link to="/dashboard/apprenant">
          <FontAwesomeIcon icon={faChevronLeft} /> Retour au dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className={`course-player-shell ${modalCoursTermine ? "course-player--complete" : ""}`}>
      <PublicNavbar
        menuItems={[
          { label: "Accueil", to: "/" },
          { label: "Formations", to: "/formations" },
          { label: "Dashboard", to: "/dashboard/apprenant" },
          { label: "Mon profil", to: "/profil" },
        ]}
      />

      <div className="course-player">
        <aside className="course-player-sidebar">
          <Link to="/dashboard/apprenant" className="course-player-back">
            <FontAwesomeIcon icon={faChevronLeft} /> Retour
          </Link>
          <div className="course-player-sidebar-title">
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>Modules du cours</span>
          </div>
          <div className="course-player-progress-mini">
            <span>Progression</span>
            <strong>{progression}%</strong>
            <div className="course-player-progress-track">
              <div style={{ width: `${progression}%` }} />
            </div>
          </div>
          <ol className="course-player-steps">
            {modules.map((module, index) => {
              const fait = Boolean(modulesCompletes[cleModule(module, index)]);
              const actif = index === moduleActif;
              return (
                <li key={cleModule(module, index)}>
                  <button
                    type="button"
                    className={`course-player-step ${actif ? "active" : ""} ${fait ? "done" : ""}`}
                    onClick={() => allerModule(index)}
                  >
                    <span className="course-player-step-dot">
                      {fait ? <FontAwesomeIcon icon={faCheckCircle} /> : index + 1}
                    </span>
                    <span>
                      <small>Module {index + 1}</small>
                      {module.titre}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="course-player-main">
          <header className="course-player-topbar">
            <div>
              <span className="course-player-kicker">
                <FontAwesomeIcon icon={faBookOpen} /> Formation en cours
              </span>
              <h1>{formation.titre}</h1>
            </div>
            <div className="course-player-top-progress">
              <span>{nbCompletes}/{modules.length} modules</span>
              <div className="course-player-progress-track">
                <div style={{ width: `${progression}%` }} />
              </div>
            </div>
          </header>

          <article className="course-player-panel">
            <div className="course-player-panel-head">
              <span><FontAwesomeIcon icon={faPlay} /> Module {moduleActif + 1}</span>
              <span><FontAwesomeIcon icon={faClock} /> 5 min</span>
            </div>
            <h2>{moduleCourant?.titre}</h2>
            <p>{moduleCourant?.contenu || "Le contenu de ce module sera bientôt disponible."}</p>
            <div className="course-player-check">
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(modulesCompletes[cleModule(moduleCourant, moduleActif)])}
                  onChange={() => basculerModule(cleModule(moduleCourant, moduleActif))}
                />
                <span>Marquer ce module comme terminé</span>
              </label>
            </div>
          </article>

          <footer className="course-player-footer">
            <button type="button" onClick={() => allerModule(moduleActif - 1)} disabled={moduleActif === 0}>
              <FontAwesomeIcon icon={faArrowLeft} /> Précédent
            </button>
            <button type="button" className="next" onClick={() => allerModule(moduleActif + 1)} disabled={moduleActif === modules.length - 1}>
              Suivant <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </footer>
        </section>
      </div>

      {modalCoursTermine && (
        <div className="course-complete-overlay" role="presentation">
          <section className="course-complete-modal" role="dialog" aria-modal="true" aria-labelledby="course-complete-title">
            <button
              type="button"
              className="course-complete-close"
              aria-label="Fermer"
              onClick={() => setModalCoursTermine(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <div className="course-complete-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faTrophy} />
            </div>
            <p className="course-complete-kicker">Progression 100%</p>
            <h2 id="course-complete-title">Cours terminé, félicitations !</h2>
            <p>Vous avez terminé tous les modules de cette formation. Vous pouvez revoir le contenu à votre rythme.</p>
            <button type="button" className="course-complete-action" onClick={() => setModalCoursTermine(false)}>
              Continuer
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default SuiviFormation;
