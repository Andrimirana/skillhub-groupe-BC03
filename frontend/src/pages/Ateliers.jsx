import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import AtelierCard from "../components/AtelierCard";
import { listerFormationsApprenant, listerMesFormations } from "../services/formationsApi";
import { recupererUtilisateur } from "../services/auth";
import "../styles/layout.css";

const IMAGES_FORMATIONS = [
  "/assets/images/learning/learning-hero.jpg",
  "/assets/images/learning/learning-laptop.jpg",
  "/assets/images/learning/learning-notes.jpg",
  "/assets/images/learning/learning-team.jpg",
];

function Ateliers() {
  const [formations, setFormations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const utilisateur = recupererUtilisateur();
  const estFormateur = utilisateur?.role === "formateur";

  useEffect(() => {
    const chargerFormations = async () => {
      try {
        setErreurChargement("");
        const donnees = estFormateur
          ? await listerMesFormations()
          : await listerFormationsApprenant();
        setFormations(donnees);
      } catch {
        setErreurChargement("Impossible de charger les formations depuis le backend.");
      } finally {
        setChargement(false);
      }
    };

    chargerFormations();
  }, [estFormateur]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area">
        <DashboardNavbar />

        <section className="page-content">
          <div className="page-head">
            <h2 className="page-title">{estFormateur ? "Mes formations" : "Mes formations suivies"}</h2>
            <p className="page-subtitle">
              {estFormateur
                ? "Retrouvez toutes les formations que vous avez publiées."
                : "Retrouvez les formations que vous suivez actuellement."}
            </p>
          </div>

          {erreurChargement && <p className="error">{erreurChargement}</p>}
          {!chargement && !erreurChargement && formations.length === 0 && (
            <p>{estFormateur ? "Aucune formation publiée pour le moment." : "Aucune formation suivie pour le moment."}</p>
          )}

          <div className="atelier-list">
            {formations.map((formation, index) => (
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
                inscrits={formation.apprenants ?? formation.vues ?? 0}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Ateliers;
