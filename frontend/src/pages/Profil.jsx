import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import ProfilePanel from "../components/ProfilePanel";
import { recupererUtilisateur } from "../services/auth";
import { listerFormationsApprenant, listerMesFormations } from "../services/formationsApi";
import "../styles/layout.css";
import "../styles/profilePanel.css";

function Profil() {
  const utilisateur = recupererUtilisateur();
  const [formationsCount, setFormationsCount] = useState(0);

  useEffect(() => {
    const charger = async () => {
      try {
        const formations = utilisateur?.role === "formateur"
          ? await listerMesFormations()
          : await listerFormationsApprenant();
        setFormationsCount(formations.length);
      } catch {
        setFormationsCount(0);
      }
    };

    charger();
  }, [utilisateur?.role]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-area" role="main">
        <DashboardNavbar />
        <section className="page-content profile-page" aria-labelledby="profile-page-title">
          <ProfilePanel titleId="profile-page-title" formationsCount={formationsCount} />
        </section>
      </main>
    </div>
  );
}

export default Profil;
