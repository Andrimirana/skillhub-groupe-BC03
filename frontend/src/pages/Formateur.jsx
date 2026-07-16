import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faChartLine,
  faEye,
  faLayerGroup,
  faPenToSquare,
  faPlus,
  faTriangleExclamation,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import Summary from "../components/Summary";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import EmptyState from "../components/EmptyState";
import SkeletonGrid from "../components/SkeletonGrid";
import AtelierCard from "../components/AtelierCard";
import { listerMesFormations, supprimerFormation } from "../services/formationsApi";
import { recupererUtilisateur } from "../services/auth";
import "../styles/layout.css";

function Formateur() {
  const navigate = useNavigate();
  const utilisateur = recupererUtilisateur();
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState(null);
  const [formations, setFormations] = useState([]);

  useEffect(() => {
    const chargerFormations = async () => {
      try {
        setErreurChargement("");
        const donnees = await listerMesFormations();
        setFormations(donnees);
      } catch {
        setErreurChargement("Impossible de charger les formations depuis le backend.");
      } finally {
        setChargement(false);
      }
    };

    chargerFormations();
  }, []);

  const gererSuppression = async (idFormation) => {
    setSuppressionEnCours(idFormation);

    try {
      await supprimerFormation(idFormation);
      setFormations((precedentes) => precedentes.filter((formation) => formation.id !== idFormation));
    } catch (e) {
      setErreurChargement(e.response?.data?.message || "Impossible de supprimer cette formation.");
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const formationsFiltrees = formations.filter((formation) =>
    formation.titre.toLowerCase().includes(recherche.toLowerCase()),
  );

  const prenom = (utilisateur?.nom || utilisateur?.email || "formateur").split(" ")[0];
  const totalApprenants = formations.reduce((total, formation) => total + (formation.apprenants ?? formation.apprenants_count ?? 0), 0);
  const totalModules = formations.reduce((total, formation) => total + (formation.modules?.length || 0), 0);
  const totalVues = formations.reduce((total, formation) => total + (formation.vues ?? 0), 0);
  const formationLaPlusSuivie = useMemo(
    () => [...formations].sort((a, b) => (b.apprenants ?? 0) - (a.apprenants ?? 0))[0] || null,
    [formations],
  );
  const performances = useMemo(
    () => [...formations]
      .sort((a, b) => ((b.apprenants ?? 0) + (b.vues ?? 0)) - ((a.apprenants ?? 0) + (a.vues ?? 0)))
      .slice(0, 4),
    [formations],
  );

  const indicateursResume = [
    {
      label: "Formations créées",
      value: formations.length,
      description: "Dans votre catalogue",
      icon: faBookOpen,
      tone: "blue",
    },
    {
      label: "Apprenants inscrits",
      value: totalApprenants,
      description: "Toutes formations",
      icon: faUsers,
      tone: "cyan",
    },
    {
      label: "Modules publiés",
      value: totalModules,
      description: "Contenus disponibles",
      icon: faLayerGroup,
      tone: "turquoise",
    },
    {
      label: "Vues cumulées",
      value: totalVues,
      description: "Consultations reçues",
      icon: faEye,
      tone: "green",
    },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <DashboardNavbar />

        <section className="page-content">
          <div className="page-head page-head--with-action page-head--compact dashboard-page-head">
            <Link to="/creer-atelier" className="btn-create btn-icon-only" aria-label="Ajouter une formation" title="Ajouter une formation">
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            </Link>
          </div>

          <div className="dashboard-hero dashboard-hero--formateur">
            <div className="dashboard-hero-copy">
              <span className="dashboard-eyebrow">Espace formateur</span>
              <h3>Bonjour, {prenom}</h3>
              <p>Suivez vos formations et accompagnez la progression de vos apprenants.</p>
              <div className="dashboard-hero-actions">
                <Link to="/creer-atelier" className="btn-create">
                  Créer une formation <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                <Link to="/mes-ateliers" className="btn-secondary">Gérer mes formations</Link>
              </div>
            </div>
            <div className="dashboard-hero-card dashboard-activity-card">
              <span>{formations.length}</span>
              <small>formation{formations.length > 1 ? "s" : ""} créée{formations.length > 1 ? "s" : ""}</small>
              <em>{totalApprenants} apprenant{totalApprenants > 1 ? "s" : ""} inscrit{totalApprenants > 1 ? "s" : ""}</em>
            </div>
          </div>

          <Summary items={indicateursResume} />

          <div className="toolbar">
            <Searchbar search={recherche} setSearch={setRecherche} />
            <Link to="/creer-atelier" className="btn-create">Créer une formation</Link>
          </div>

          {suppressionEnCours !== null && <p className="status-banner">Suppression de la formation en cours...</p>}

          {chargement && (
            <div className="dashboard-panel">
              <SkeletonGrid count={3} />
            </div>
          )}

          {!chargement && erreurChargement && (
            <EmptyState
              icon={faTriangleExclamation}
              title="Impossible de charger vos formations"
              description={erreurChargement}
            />
          )}

          {!chargement && !erreurChargement && (
            <>
              <section className="dashboard-panel dashboard-panel--featured">
                <div className="dashboard-section-head">
                  <div>
                    <span className="dashboard-eyebrow">Catalogue</span>
                    <h3>Mes formations</h3>
                  </div>
                  <Link to="/creer-atelier" className="btn-secondary">Ajouter</Link>
                </div>

                {formationsFiltrees.length === 0 ? (
                  <EmptyState
                    compact
                    icon={faBookOpen}
                    title={formations.length === 0 ? "Vous n’avez encore créé aucune formation." : "Aucune formation trouvée"}
                    description={formations.length === 0 ? "Créez votre première formation pour commencer." : "Ajustez votre recherche pour retrouver une formation."}
                    action={<Link to="/creer-atelier" className="btn-create">Ajouter une formation</Link>}
                  />
                ) : (
                  <div className="atelier-list">
                    {formationsFiltrees.map((formation) => (
                      <AtelierCard
                        key={formation.id}
                        id={formation.id}
                        titre={formation.titre}
                        description={formation.description}
                        image={formation.image_url || formation.imageUrl}
                        formateur={formation.formateur || formation.formateur_nom || utilisateur?.nom || "Formateur SkillHub"}
                        duration={Number(formation.duration || formation.duree || 1)}
                        inscrits={Number(formation.apprenants ?? formation.apprenants_count ?? 0)}
                        actions={(
                          <>
                            <button type="button" className="f-btn f-btn--info" onClick={() => navigate(`/formation/${formation.id}`)}>
                              Consulter
                            </button>
                            <button type="button" className="f-btn f-btn--start" onClick={() => navigate(`/modifier-formation/${formation.id}`)}>
                              <FontAwesomeIcon icon={faPenToSquare} /> Modifier
                            </button>
                            <button type="button" className="btn-delete" onClick={() => gererSuppression(formation.id)} disabled={suppressionEnCours === formation.id}>
                              {suppressionEnCours === formation.id ? "Suppression..." : "Supprimer"}
                            </button>
                          </>
                        )}
                      />
                    ))}
                  </div>
                )}
              </section>

              <div className="dashboard-grid dashboard-grid--secondary">
                <section className="dashboard-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Suivi</span>
                      <h3>Progression des apprenants</h3>
                    </div>
                  </div>
                  <EmptyState
                    compact
                    icon={faChartLine}
                    title="Aucune donnée de progression disponible."
                    description="Les progressions détaillées apparaîtront lorsque ces données seront fournies par l’API."
                  />
                </section>

                <section className="dashboard-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Inscriptions</span>
                      <h3>Inscriptions récentes</h3>
                    </div>
                  </div>
                  <EmptyState
                    compact
                    icon={faUsers}
                    title="Aucune inscription récente."
                    description="Le détail des inscriptions apparaîtra ici dès qu’il sera disponible."
                  />
                </section>
              </div>

              <div className="dashboard-grid dashboard-grid--secondary">
                <section className="dashboard-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Performance</span>
                      <h3>Performances des formations</h3>
                    </div>
                  </div>
                  {performances.length === 0 ? (
                    <EmptyState
                      compact
                      icon={faChartLine}
                      title="Aucune donnée disponible"
                      description="Créez une formation pour commencer à suivre ses performances."
                    />
                  ) : (
                    <div className="dashboard-list">
                      {performances.map((formation) => (
                        <article className="dashboard-list-item" key={formation.id}>
                          <span className="dashboard-list-icon"><FontAwesomeIcon icon={faChartLine} /></span>
                          <div>
                            <strong>{formation.titre}</strong>
                            <small>{formation.apprenants ?? 0} inscrit{(formation.apprenants ?? 0) > 1 ? "s" : ""} · {formation.vues ?? 0} vue{(formation.vues ?? 0) > 1 ? "s" : ""}</small>
                          </div>
                          <button type="button" className="btn-secondary" onClick={() => navigate(`/formation/${formation.id}`)}>
                            Voir
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboard-panel dashboard-actions-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Raccourcis</span>
                      <h3>Actions rapides</h3>
                    </div>
                  </div>
                  <div className="quick-actions-grid">
                    <Link to="/creer-atelier" className="btn-create">Créer une formation</Link>
                    <Link to="/mes-ateliers" className="btn-secondary">Gérer les formations</Link>
                    {formationLaPlusSuivie && (
                      <Link to={`/formation/${formationLaPlusSuivie.id}`} className="btn-secondary">Consulter la plus suivie</Link>
                    )}
                  </div>
                </section>
              </div>

              {formationsFiltrees.length > 0 && (
                <section className="dashboard-panel">
                  <div className="dashboard-section-head">
                    <div>
                      <span className="dashboard-eyebrow">Gestion</span>
                      <h3>Vue détaillée</h3>
                    </div>
                  </div>
                  <Table
                    formations={formationsFiltrees}
                    mode="formateur"
                    onView={(formation) => navigate(`/formation/${formation.id}`)}
                    onEdit={(formation) => navigate(`/modifier-formation/${formation.id}`)}
                    onDelete={gererSuppression}
                  />
                </section>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Formateur;
