/*
| Projet: SkillHub
| Rôle du fichier: Page liste des ateliers
| Dernière modification: 2026-03-06
*/

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AtelierCard from "../components/AtelierCard";
import { listerFormationsApprenant, listerMesFormations } from "../services/formationsApi";
import { recupererUtilisateur } from "../services/auth";
import "../styles/layout.css";

function Ateliers() {
  const [ateliersLocaux, setAteliersLocaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const utilisateur = recupererUtilisateur();

  useEffect(() => {
    // Le formateur voit uniquement ses propres formations
    const chargerAteliers = async () => {
      try {
        setErreurChargement("");
        const donnees = utilisateur?.role === "formateur"
          ? await listerMesFormations()
          : await listerFormationsApprenant();
        setAteliersLocaux(donnees);
      } catch {
        setErreurChargement("Impossible de charger les ateliers depuis le backend.");
      } finally {
        setChargement(false);
      }
    };

    chargerAteliers();
  }, [utilisateur?.role]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area">
        <Topbar />

        <section className="page-content">
          <div className="page-head">
            <h2 className="page-title">Mes formations</h2>
            <p className="page-subtitle">Retrouvez toutes vos formations.</p>
          </div>

          {chargement && <p className="status-banner">Chargement des formations...</p>}
          {erreurChargement && <p className="error">{erreurChargement}</p>}
          {!chargement && !erreurChargement && ateliersLocaux.length === 0 && (
            <p className="status-banner">Aucune formation publiée pour le moment.</p>
          )}

          <div className="atelier-list">
            {ateliersLocaux.map((atelier) => (
              <AtelierCard
                key={atelier.id}
                titre={atelier.titre}
                description={atelier.description}
                date={atelier.date}
                statut={atelier.statut}
                price={atelier.price}
                duration={atelier.duration}
                level={atelier.level}
                inscrits={atelier.vues ?? 0}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Ateliers;
