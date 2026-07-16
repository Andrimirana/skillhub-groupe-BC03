import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import { detailFormation, modifierFormation } from "../services/formationsApi";
import "../styles/layout.css";

const MODULE_VIDE = { titre: "", contenu: "" };

function ModifierFormation() {
  const { idFormation } = useParams();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(true);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [formationChargee, setFormationChargee] = useState(false);
  const [formulaire, setFormulaire] = useState({
    titre: "",
    description: "",
    category: "Développement web",
    date: "",
    duration: "",
    level: "beginner",
    image_url: "",
    modules: [{ ...MODULE_VIDE }],
  });

  useEffect(() => {
    const chargerFormation = async () => {
      try {
        setErreur("");
        const formationCible = await detailFormation(idFormation);

        if (!formationCible) {
          setErreur("Formation introuvable.");
          return;
        }

        setFormulaire({
          titre: formationCible.titre ?? "",
          description: formationCible.description ?? "",
          category: formationCible.category ?? "Développement web",
          date: formationCible.date ?? "",
          duration: String(formationCible.duration ?? ""),
          level: formationCible.level ?? "beginner",
          image_url: formationCible.image_url ?? formationCible.imageUrl ?? "",
          modules: (formationCible.modules?.length ? formationCible.modules : [{ ...MODULE_VIDE }]).map((module) => ({
            titre: module.titre ?? "",
            contenu: module.contenu ?? "",
          })),
        });
        setFormationChargee(true);
      } catch {
        setErreur("Impossible de charger cette formation.");
      } finally {
        setChargement(false);
      }
    };

    chargerFormation();
  }, [idFormation]);

  const gererChangement = (champ, valeur) => {
    setFormulaire((precedent) => ({
      ...precedent,
      [champ]: valeur,
    }));
  };

  const gererChangementModule = (index, champ, valeur) => {
    setFormulaire((precedent) => ({
      ...precedent,
      modules: precedent.modules.map((module, moduleIndex) => (
        moduleIndex === index ? { ...module, [champ]: valeur } : module
      )),
    }));
  };

  const ajouterModule = () => {
    setFormulaire((precedent) => ({
      ...precedent,
      modules: [...precedent.modules, { ...MODULE_VIDE }],
    }));
  };

  const supprimerModule = (index) => {
    setFormulaire((precedent) => ({
      ...precedent,
      modules: precedent.modules.filter((_, moduleIndex) => moduleIndex !== index),
    }));
  };

  const validerFormulaire = () => {
    if (!formulaire.titre.trim()) return "Le titre est obligatoire.";
    if (!formulaire.description.trim()) return "La description est obligatoire.";
    if (!formulaire.category.trim()) return "La catégorie est obligatoire.";
    if (!formulaire.date) return "La date est obligatoire.";
    if (!formulaire.duration || Number.isNaN(Number(formulaire.duration)) || Number(formulaire.duration) < 1) {
      return "La durée doit être un entier supérieur à 0.";
    }
    if (!["beginner", "intermediaire", "advanced"].includes(formulaire.level)) {
      return "Le niveau sélectionné est invalide.";
    }
    if (!Array.isArray(formulaire.modules) || formulaire.modules.length < 1) {
      return "La formation doit contenir au minimum 1 module.";
    }
    if (formulaire.modules.some((module) => !module.titre.trim() || !module.contenu.trim())) {
      return "Chaque module doit avoir un titre et un contenu.";
    }
    return "";
  };

  const gererSoumission = async (evenement) => {
    evenement.preventDefault();

    const messageErreur = validerFormulaire();
    if (messageErreur) {
      setErreur(messageErreur);
      return;
    }

    setSauvegardeEnCours(true);
    setErreur("");
    setSucces("");

    try {
      await modifierFormation(idFormation, {
        titre: formulaire.titre.trim(),
        description: formulaire.description.trim(),
        category: formulaire.category,
        date: formulaire.date,
        statut: "À venir",
        duration: Number(formulaire.duration),
        level: formulaire.level,
        image_url: formulaire.image_url.trim() || null,
        modules: formulaire.modules.map((module) => ({
          titre: module.titre.trim(),
          contenu: module.contenu.trim(),
        })),
      });

      setSucces("Formation modifiée avec succès.");
      setTimeout(() => {
        navigate("/dashboard/formateur", { replace: true });
      }, 650);
    } catch (e) {
      const message = e.response?.data?.message || "Impossible de modifier cette formation.";
      setErreur(message);
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area" role="main">
        <DashboardNavbar />

        <section className="page-content create-course-page" aria-labelledby="page-title-modif">
          <div className="page-head create-course-head">
            <h2 id="page-title-modif" className="page-title">Modifier une formation</h2>
            <p className="page-subtitle">Les informations et modules viennent directement de la base de données.</p>
          </div>

          {erreur && <p className="error">{erreur}</p>}

          {chargement && <p className="status-banner">Chargement de la formation...</p>}

          {!chargement && formationChargee && (
            <form className="form-create form-create--course" onSubmit={gererSoumission} noValidate>
              <section className="form-section">
                <div className="form-section-head">
                  <div>
                    <h3>Informations</h3>
                    <p>Toutes les formations restent gratuites.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Titre
                    <input type="text" value={formulaire.titre} onChange={(event) => gererChangement("titre", event.target.value)} />
                  </label>

                  <label>
                    Catégorie
                    <select value={formulaire.category} onChange={(event) => gererChangement("category", event.target.value)}>
                      <option value="Développement web">Développement web</option>
                      <option value="Data">Data</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </label>

                  <label>
                    Date
                    <input type="date" value={formulaire.date} onChange={(event) => gererChangement("date", event.target.value)} />
                  </label>

                  <label>
                    Durée (heures)
                    <input type="number" min="1" step="1" value={formulaire.duration} onChange={(event) => gererChangement("duration", event.target.value)} />
                  </label>

                  <label>
                    Niveau
                    <select value={formulaire.level} onChange={(event) => gererChangement("level", event.target.value)}>
                      <option value="beginner">Débutant</option>
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="advanced">Avancé</option>
                    </select>
                  </label>

                  <label className="form-field-wide">
                    Image du cours
                    <input type="url" value={formulaire.image_url} onChange={(event) => gererChangement("image_url", event.target.value)} placeholder="https://exemple.com/image-cours.jpg" />
                  </label>
                </div>

                <label>
                  Description
                  <textarea value={formulaire.description} onChange={(event) => gererChangement("description", event.target.value)} />
                </label>
              </section>

              <section className="form-section">
                <div className="form-section-head">
                  <div>
                    <h3>Modules</h3>
                    <p>{formulaire.modules.length} module{formulaire.modules.length > 1 ? "s" : ""}</p>
                  </div>
                  <button type="button" className="btn-secondary btn-compact" onClick={ajouterModule}>
                    Ajouter un module
                  </button>
                </div>

                <div className="course-modules-grid">
                  {formulaire.modules.map((module, index) => (
                    <div key={`module-edit-${index}`} className="module-editor-block">
                      <div className="module-editor-head">
                        <strong>Module {index + 1}</strong>
                        {formulaire.modules.length > 1 && (
                          <button type="button" className="btn-link-danger" onClick={() => supprimerModule(index)} aria-label={`Supprimer le module ${index + 1}`}>
                            ×
                          </button>
                        )}
                      </div>

                      <label>
                        Titre du module
                        <input type="text" value={module.titre} onChange={(event) => gererChangementModule(index, "titre", event.target.value)} />
                      </label>

                      <label>
                        Contenu du module
                        <textarea value={module.contenu} onChange={(event) => gererChangementModule(index, "contenu", event.target.value)} />
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {succes && <p className="success">{succes}</p>}

              <div className="toolbar">
                <button type="submit" className="btn-create" disabled={sauvegardeEnCours}>
                  {sauvegardeEnCours ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard/formateur")}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default ModifierFormation;
