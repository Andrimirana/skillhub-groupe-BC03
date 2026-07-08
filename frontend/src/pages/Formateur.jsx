import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import Summary from "../components/Summary";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import { listerMesFormations, supprimerFormation } from "../services/formationsApi";
import "../styles/layout.css";
import "../styles/Bouton.css";

function Formateur() {
  const navigate = useNavigate();
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

  const formationsFiltrees = formations
    .filter((formation) => formation.titre.toLowerCase().includes(recherche.toLowerCase()));

  const indicateursResume = [
    { label: "Formations créées", value: formations.length },
    { label: "Apprenants inscrits", value: formations.reduce((total, formation) => total + (formation.apprenants ?? 0), 0) },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <DashboardNavbar />

        <section className="page-content" aria-labelledby="page-title-formateur">
          <div className="page-head page-head--with-action">
            <div>
              <h2 id="page-title-formateur" className="page-title">Tableau de bord formateur</h2>
              <p className="page-subtitle">Gérez vos formations et suivez vos apprenants.</p>
            </div>
            <Link to="/creer-atelier" className="btn-create btn-icon-only" aria-label="Ajouter une formation" title="Ajouter une formation">
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            </Link>
          </div>

          <Summary items={indicateursResume} />

          <div className="toolbar">
            <Searchbar search={recherche} setSearch={setRecherche} />
          </div>

          <div className="dashboard-panel">
            {suppressionEnCours !== null && <p className="status-banner">Suppression de la formation en cours...</p>}
            {erreurChargement && <p className="error">{erreurChargement}</p>}
            {!chargement && !erreurChargement && formationsFiltrees.length === 0 && (
              <p className="status-banner">Aucune formation ne correspond aux filtres.</p>
            )}

            <Table
              formations={formationsFiltrees}
              mode="formateur"
              onView={(formation) => navigate(`/formation/${formation.id}`)}
              onEdit={(formation) => navigate(`/modifier-formation/${formation.id}`)}
              onDelete={gererSuppression}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Formateur;
