import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import { creerFormation } from "../services/formationsApi";
import "../styles/layout.css";
import "../styles/Bouton.css";

const MODULE_INITIAL = { titre: "", contenu: "" };

function CreerAtelier() {
  const navigate = useNavigate();
  const [formulaire, setFormulaire] = useState({
    titre: "",
    description: "",
    category: "Développement web",
    date: "",
    duration: "",
    level: "beginner",
    modules: [{ ...MODULE_INITIAL }],
  });
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(false);

  const changerChamp = (champ, valeur) => {
    setFormulaire((etat) => ({ ...etat, [champ]: valeur }));
  };

  const changerModule = (index, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: etat.modules.map((module, moduleIndex) =>
        moduleIndex === index ? { ...module, [champ]: valeur } : module,
      ),
    }));
  };

  const ajouterModule = () => {
    setFormulaire((etat) => ({
      ...etat,
      modules: [...etat.modules, { ...MODULE_INITIAL }],
    }));
  };

  const supprimerModule = (index) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: etat.modules.filter((_, moduleIndex) => moduleIndex !== index),
    }));
  };

  const valider = () => {
    const prochains = {};

    if (!formulaire.titre.trim()) prochains.titre = "Le titre est obligatoire.";
    if (!formulaire.description.trim()) prochains.description = "La description est obligatoire.";
    if (!formulaire.category.trim()) prochains.category = "La catégorie est obligatoire.";
    if (!formulaire.date) prochains.date = "La date est obligatoire.";
    if (!formulaire.duration || Number.isNaN(Number(formulaire.duration)) || Number(formulaire.duration) < 1) {
      prochains.duration = "La durée doit être supérieure à 0.";
    }
    if (!["beginner", "intermediaire", "advanced"].includes(formulaire.level)) {
      prochains.level = "Le niveau sélectionné est invalide.";
    }
    if (formulaire.modules.length < 1) {
      prochains.modules = "Ajoutez au moins un module.";
    }

    formulaire.modules.forEach((module, index) => {
      if (!module.titre.trim() || !module.contenu.trim()) {
        prochains[`module-${index}`] = "Titre et contenu obligatoires.";
      }
    });

    return prochains;
  };

  const gererSoumission = async (event) => {
    event.preventDefault();
    const prochains = valider();

    if (Object.keys(prochains).length > 0) {
      setErreurs(prochains);
      return;
    }

    setChargement(true);
    setErreurs({});

    try {
      await creerFormation({
        titre: formulaire.titre.trim(),
        description: formulaire.description.trim(),
        category: formulaire.category,
        date: formulaire.date,
        statut: "À venir",
        price: 0,
        duration: Number(formulaire.duration),
        level: formulaire.level,
        modules: formulaire.modules.map((module) => ({
          titre: module.titre.trim(),
          contenu: module.contenu.trim(),
        })),
      });

      navigate("/dashboard/formateur", { replace: true });
    } catch (e) {
      setErreurs({ general: e.response?.data?.message || "Impossible d'ajouter la formation." });
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area">
        <DashboardNavbar />

        <section className="page-content create-course-page" aria-labelledby="page-title">
          <div className="page-head">
            <h2 id="page-title" className="page-title">Ajouter une formation</h2>
            <p className="page-subtitle">Toutes les formations sont gratuites. Structurez librement vos modules.</p>
          </div>

          <form onSubmit={gererSoumission} className="form-create form-create--course" noValidate>
            {erreurs.general && <p className="error">{erreurs.general}</p>}

            <div className="form-section">
              <h3>Informations générales</h3>
              <div className="form-grid">
                <label>
                  Titre
                  <input value={formulaire.titre} onChange={(event) => changerChamp("titre", event.target.value)} placeholder="Ex : Laravel et API REST" />
                  {erreurs.titre && <p className="form-error">{erreurs.titre}</p>}
                </label>

                <label>
                  Catégorie
                  <select value={formulaire.category} onChange={(event) => changerChamp("category", event.target.value)}>
                    <option value="Développement web">Développement web</option>
                    <option value="Data">Data</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                  {erreurs.category && <p className="form-error">{erreurs.category}</p>}
                </label>

                <label className="form-field-wide">
                  Description
                  <textarea value={formulaire.description} onChange={(event) => changerChamp("description", event.target.value)} placeholder="Décrivez les objectifs, les prérequis et les résultats attendus." />
                  {erreurs.description && <p className="form-error">{erreurs.description}</p>}
                </label>

                <label>
                  Date
                  <input type="date" value={formulaire.date} onChange={(event) => changerChamp("date", event.target.value)} />
                  {erreurs.date && <p className="form-error">{erreurs.date}</p>}
                </label>

                <label>
                  Durée (heures)
                  <input type="number" min="1" step="1" value={formulaire.duration} onChange={(event) => changerChamp("duration", event.target.value)} placeholder="2" />
                  {erreurs.duration && <p className="form-error">{erreurs.duration}</p>}
                </label>

                <label>
                  Niveau
                  <select value={formulaire.level} onChange={(event) => changerChamp("level", event.target.value)}>
                    <option value="beginner">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                  {erreurs.level && <p className="form-error">{erreurs.level}</p>}
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-head">
                <div>
                  <h3>Modules</h3>
                  <p>{formulaire.modules.length} module{formulaire.modules.length > 1 ? "s" : ""}</p>
                </div>
                <button type="button" className="btn-secondary btn-compact" onClick={ajouterModule}>
                  Ajouter un module
                </button>
              </div>
              {erreurs.modules && <p className="form-error">{erreurs.modules}</p>}

              <div className="course-modules-grid">
                {formulaire.modules.map((module, index) => (
                  <div key={`module-${index}`} className="module-editor-block">
                    <div className="module-editor-head">
                      <strong>Module {index + 1}</strong>
                      {formulaire.modules.length > 1 && (
                        <button type="button" className="btn-link-danger" onClick={() => supprimerModule(index)}>
                          Supprimer
                        </button>
                      )}
                    </div>
                    <label>
                      Titre
                      <input value={module.titre} onChange={(event) => changerModule(index, "titre", event.target.value)} placeholder="Titre du module" />
                    </label>
                    <label>
                      Contenu
                      <textarea value={module.contenu} onChange={(event) => changerModule(index, "contenu", event.target.value)} placeholder="Contenu du module" />
                    </label>
                    {erreurs[`module-${index}`] && <p className="form-error">{erreurs[`module-${index}`]}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <Link to="/dashboard/formateur" className="btn-secondary">Annuler</Link>
              <button type="submit" className="btn-create" disabled={chargement}>
                {chargement ? "Ajout..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default CreerAtelier;
