import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faChartLine,
  faCheckCircle,
  faGraduationCap,
  faLayerGroup,
  faListCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import Summary from "../components/Summary";
import Searchbar from "../components/Searchbar";
import AtelierCard from "../components/AtelierCard";
import EmptyState from "../components/EmptyState";
import SkeletonGrid from "../components/SkeletonGrid";
import {
  desinscrireFormation,
  inscrireFormation,
  listerFormations,
  listerFormationsApprenant,
} from "../services/formationsApi";
import { recupererUtilisateur } from "../services/auth";
import "../styles/layout.css";
import "../styles/atelierCard.css";

const IMAGES_FORMATIONS = [
  "/assets/images/learning/learning-hero.jpg",
  "/assets/images/learning/learning-laptop.jpg",
  "/assets/images/learning/learning-notes.jpg",
  "/assets/images/learning/learning-team.jpg",
];

function getCleModule(module) {
  return String(module?.id ?? module?.titre ?? "");
}

function Apprenant() {
  const navigate = useNavigate();
  const utilisateur = recupererUtilisateur();
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const [formationsSuivies, setFormationsSuivies] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [actionEnCours, setActionEnCours] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setErreurChargement("");
        const [suivies, toutes] = await Promise.all([
          listerFormationsApprenant(),
          listerFormations(),
        ]);
        setFormationsSuivies(suivies);
        setCatalogue(toutes);
      } catch {
        setErreurChargement("Impossible de charger les formations.");
      } finally {
        setChargement(false);
      }
    };

    charger();
  }, []);

  const idsSuivis = useMemo(
    () => new Set(formationsSuivies.map((formation) => formation.id)),
    [formationsSuivies],
  );

  const suggestions = useMemo(
    () => catalogue.filter((formation) => !idsSuivis.has(formation.id)).slice(0, 4),
    [catalogue, idsSuivis],
  );

  const formationsFiltrees = formationsSuivies.filter((formation) =>
    formation.titre.toLowerCase().includes(recherche.toLowerCase()),
  );

  const prenom = (utilisateur?.nom || utilisateur?.email || "apprenant").split(" ")[0];
  const totalModules = formationsSuivies.reduce((total, formation) => total + (formation.modules?.length || 0), 0);
  const modulesTermines = formationsSuivies.reduce(
    (total, formation) => total + (formation.completed_modules?.length || 0),
    0,
  );
  const modulesRestants = Math.max(totalModules - modulesTermines, 0);
  const progressionMoyenne = formationsSuivies.length === 0
    ? 0
    : Math.round(formationsSuivies.reduce((total, formation) => total + (formation.progression ?? 0), 0) / formationsSuivies.length);
  const formationsTerminees = formationsSuivies.filter((formation) => (formation.progression ?? 0) >= 100).length;
  const formationsEnCours = formationsSuivies.filter((formation) => (formation.progression ?? 0) < 100);
  const formationActive = formationsEnCours[0] || formationsSuivies[0] || null;
  const prochainModule = formationActive?.modules?.find((module) => {
    const modulesFaits = new Set((formationActive.completed_modules || []).map(String));
    return !modulesFaits.has(getCleModule(module));
  });
  const prochainsModules = formationsSuivies.flatMap((formation) => {
    const modulesFaits = new Set((formation.completed_modules || []).map(String));
    return (formation.modules || [])
      .filter((module) => !modulesFaits.has(getCleModule(module)))
      .slice(0, 1)
      .map((module) => ({ module, formation }));
  }).slice(0, 4);
  const activitesRecentes = formationsSuivies
    .filter((formation) => formation.date_inscription || (formation.progression ?? 0) > 0)
    .slice(0, 4);

  const indicateursResume = [
    {
      label: "Formations en cours",
      value: formationsEnCours.length,
      description: "Parcours à reprendre",
      icon: faBookOpen,
      tone: "blue",
    },
    {
      label: "Modules terminés",
      value: modulesTermines,
      description: `${modulesRestants} restant${modulesRestants > 1 ? "s" : ""}`,
      icon: faListCheck,
      tone: "cyan",
    },
    {
      label: "Progression moyenne",
      value: `${progressionMoyenne}%`,
      description: "Sur vos formations",
      icon: faChartLine,
      tone: "turquoise",
    },
    {
      label: "Formations terminées",
      value: formationsTerminees,
      description: "Progression à 100%",
      icon: faCheckCircle,
      tone: "green",
    },
  ];

  const gererSuivre = async (idFormation) => {
    try {
      setActionEnCours(`suivre-${idFormation}`);
      await inscrireFormation(idFormation);
      const [suivies, toutes] = await Promise.all([
        listerFormationsApprenant(),
        listerFormations(),
      ]);
      setFormationsSuivies(suivies);
      setCatalogue(toutes);
    } catch (e) {
      setErreurChargement(e.response?.data?.message || "Impossible de suivre cette formation.");
    } finally {
      setActionEnCours(null);
    }
  };

  const gererNePlusSuivre = async (idFormation) => {
    const confirmer = window.confirm("Voulez-vous vraiment vous désinscrire de cette formation ?");

    if (!confirmer) {
      return;
    }

    try {
      setActionEnCours(`desinscrire-${idFormation}`);
      await desinscrireFormation(idFormation);
      setFormationsSuivies((precedentes) => precedentes.filter((formation) => formation.id !== idFormation));
    } catch (e) {
      setErreurChargement(e.response?.data?.message || "Impossible de vous désinscrire.");
    } finally {
      setActionEnCours(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <DashboardNavbar />

        <section className="page-content" aria-labelledby="page-title">
          <div className="dashboard-hero dashboard-hero--apprenant">
            <div className="dashboard-hero-copy">
              <span className="dashboard-eyebrow">Espace apprenant</span>
              <h3>Bonjour, {prenom}</h3>
              <p>Continuez votre progression et avancez à votre rythme.</p>
              <div className="dashboard-hero-actions">
                {formationActive ? (
                  <button type="button" className="btn-create" onClick={() => navigate(`/apprendre/${formationActive.id}`)}>
                    Continuer ma formation <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                ) : (
                  <Link to="/formations" className="btn-create">Découvrir des formations</Link>
                )}
                <Link to="/formations" className="btn-secondary">Explorer le catalogue</Link>
              </div>
            </div>
            <div className="dashboard-hero-card dashboard-progress-card">
              <span>{progressionMoyenne}%</span>
              <small>progression globale</small>
              <div className="dashboard-progress-track">
                <div style={{ width: `${progressionMoyenne}%` }} />
              </div>
              {formationActive && <em>{formationActive.titre}</em>}
            </div>
          </div>

          <Summary items={indicateursResume} />

          <div className="toolbar" role="search">
            <Searchbar search={recherche} setSearch={setRecherche} />
            <Link to="/formations" className="btn-secondary btn-discover">Découvrir des formations</Link>
          </div>

          {chargement && (
            <div className="dashboard-panel">
              <SkeletonGrid count={3} />
            </div>
          )}

          {!chargement && erreurChargement && (
            <EmptyState
              icon={faTriangleExclamation}
              title="Impossible de charger votre dashboard"
              description={erreurChargement}
            />
          )}

          {!chargement && !erreurChargement && (
            <>
              <div className="dashboard-grid dashboard-grid--learning">
                <section className="dashboard-panel dashboard-panel--featured">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Reprise rapide</span>
                      <h3>Continuer l’apprentissage</h3>
                    </div>
                  </div>
                  {formationActive ? (
                    <article className="continue-card">
                      <img src={formationActive.image_url || formationActive.imageUrl || IMAGES_FORMATIONS[0]} alt="" aria-hidden="true" />
                      <div>
                        <span className="dashboard-badge">{formationActive.category || "Formation"}</span>
                        <h4>{formationActive.titre}</h4>
                        <p>{prochainModule ? `Prochain module : ${prochainModule.titre}` : "Vous pouvez revoir cette formation à votre rythme."}</p>
                        <div className="dashboard-progress-track">
                          <div style={{ width: `${formationActive.progression ?? 0}%` }} />
                        </div>
                        <small>{formationActive.completed_modules?.length || 0}/{formationActive.modules?.length || 0} modules terminés</small>
                      </div>
                      <button type="button" className="btn-create" onClick={() => navigate(`/apprendre/${formationActive.id}`)}>
                        Continuer
                      </button>
                    </article>
                  ) : (
                    <EmptyState
                      compact
                      icon={faGraduationCap}
                      title="Vous n’avez aucune formation en cours."
                      description="Commencez une formation pour suivre votre progression ici."
                      action={<Link to="/formations" className="btn-create">Découvrir des formations</Link>}
                    />
                  )}
                </section>

                <section className="dashboard-panel dashboard-progress-overview">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Vue globale</span>
                      <h3>Votre progression</h3>
                    </div>
                  </div>
                  <div className="progress-ring" style={{ "--progress": `${progressionMoyenne * 3.6}deg` }}>
                    <strong>{progressionMoyenne}%</strong>
                    <span>moyenne</span>
                  </div>
                  <ul className="dashboard-metric-list">
                    <li><span>Modules terminés</span><strong>{modulesTermines}</strong></li>
                    <li><span>Modules restants</span><strong>{modulesRestants}</strong></li>
                    <li><span>Formations terminées</span><strong>{formationsTerminees}</strong></li>
                  </ul>
                </section>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-section-head">
                  <div>
                    <span className="dashboard-eyebrow">Parcours suivis</span>
                    <h3>Mes formations</h3>
                  </div>
                </div>
                {formationsFiltrees.length === 0 && (
                  <EmptyState
                    compact
                    icon={faGraduationCap}
                    title="Vous n’avez aucune formation en cours."
                    description="Commencez une formation pour suivre votre progression ici."
                    action={<Link to="/formations" className="btn-create">Découvrir des formations</Link>}
                  />
                )}

                <div className="atelier-list">
                  {formationsFiltrees.map((formation, index) => (
                    <AtelierCard
                      key={formation.id}
                      id={formation.id}
                      image={formation.image_url || formation.imageUrl || IMAGES_FORMATIONS[index % IMAGES_FORMATIONS.length]}
                      titre={formation.titre}
                      description={formation.description}
                      formateur={formation.formateur || "Formateur SkillHub"}
                      date={formation.date}
                      statut={formation.statut}
                      duration={formation.duration}
                      level={formation.level}
                      inscrits={formation.apprenants ?? 0}
                      actions={(
                        <>
                          <button type="button" className="btn-create" onClick={() => navigate(`/apprendre/${formation.id}`)}>
                            Continuer
                          </button>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => gererNePlusSuivre(formation.id)}
                            disabled={actionEnCours === `desinscrire-${formation.id}`}
                          >
                            {actionEnCours === `desinscrire-${formation.id}` ? "Traitement..." : "Ne plus suivre"}
                          </button>
                        </>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="dashboard-grid dashboard-grid--secondary">
                <section className="dashboard-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">À faire ensuite</span>
                      <h3>Prochains modules</h3>
                    </div>
                  </div>
                  {prochainsModules.length === 0 ? (
                    <EmptyState
                      compact
                      icon={faLayerGroup}
                      title="Aucun module prévu prochainement."
                      description="Les prochains modules apparaîtront quand une formation en cours contient des modules à terminer."
                    />
                  ) : (
                    <div className="dashboard-list">
                      {prochainsModules.map(({ module, formation }) => (
                        <article className="dashboard-list-item" key={`${formation.id}-${module.id ?? module.titre}`}>
                          <span className="dashboard-list-icon"><FontAwesomeIcon icon={faLayerGroup} /></span>
                          <div>
                            <strong>{module.titre}</strong>
                            <small>{formation.titre}</small>
                          </div>
                          <button type="button" className="btn-secondary" onClick={() => navigate(`/apprendre/${formation.id}`)}>
                            Ouvrir
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboard-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Historique</span>
                      <h3>Activité récente</h3>
                    </div>
                  </div>
                  {activitesRecentes.length === 0 ? (
                    <EmptyState
                      compact
                      icon={faChartLine}
                      title="Aucune activité récente pour le moment."
                      description="Vos inscriptions et mises à jour de progression apparaîtront ici."
                    />
                  ) : (
                    <div className="dashboard-timeline">
                      {activitesRecentes.map((formation) => (
                        <article className="dashboard-timeline-item" key={formation.id}>
                          <span />
                          <div>
                            <strong>{formation.titre}</strong>
                            <small>{formation.progression ?? 0}% de progression</small>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-section-head">
                  <div>
                    <span className="dashboard-eyebrow">Catalogue</span>
                    <h3>Explorer d’autres formations</h3>
                  </div>
                </div>
                {suggestions.length === 0 && (
                  <EmptyState
                    compact
                    icon={faBookOpen}
                    title="Aucune suggestion disponible"
                    description="Toutes les formations du catalogue sont déjà dans votre espace."
                  />
                )}
                <div className="atelier-list">
                  {suggestions.map((formation, index) => (
                    <AtelierCard
                      key={formation.id}
                      id={formation.id}
                      image={formation.image_url || formation.imageUrl || IMAGES_FORMATIONS[index % IMAGES_FORMATIONS.length]}
                      titre={formation.titre}
                      description={formation.description}
                      formateur={formation.formateur || "Formateur SkillHub"}
                      date={formation.date}
                      statut={formation.statut}
                      duration={formation.duration}
                      level={formation.level}
                      inscrits={formation.apprenants ?? 0}
                      actions={(
                        <>
                          <button
                            type="button"
                            className="btn-create"
                            onClick={() => gererSuivre(formation.id)}
                            disabled={actionEnCours === `suivre-${formation.id}`}
                          >
                            {actionEnCours === `suivre-${formation.id}` ? "Inscription..." : "Suivre"}
                          </button>
                          <Link className="btn-secondary" to={`/formation/${formation.id}`}>Voir le détail</Link>
                        </>
                      )}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Apprenant;
