import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCheck,
  faChevronDown,
  faCopy,
  faFileArrowDown,
  faFloppyDisk,
  faImage,
  faLayerGroup,
  faPlus,
  faQuestionCircle,
  faRocket,
  faTrash,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import { creerFormation } from "../services/formationsApi";
import "../styles/layout.css";

const STORAGE_KEY = "skillhub_course_builder_draft";

const ETAPES = [
  { titre: "Informations générales", aide: "Titre, image, niveau" },
  { titre: "Programme", aide: "Modules et leçons" },
  { titre: "Quiz", aide: "Évaluations" },
  { titre: "Progression", aide: "Règles du parcours" },
  { titre: "Aperçu", aide: "Checklist et publication" },
];

const TYPES_LECONS = ["Vidéo", "Texte", "PDF", "Présentation", "Audio", "Lien externe", "Exercice pratique", "Quiz", "Projet"];
const QUESTION_TYPES = ["Choix unique", "Choix multiples", "Vrai ou faux", "Réponse courte"];

const creerLecon = (index = 0) => ({
  titre: "",
  description: "",
  type: "Texte",
  duration: "",
  ordre: index + 1,
  obligatoire: true,
  preview: false,
  contenu: "",
  videoUrl: "",
  completionVideo: 80,
  ressources: [{ titre: "", description: "", url: "", telechargeable: true }],
});

const creerModule = (index = 0) => ({
  titre: "",
  description: "",
  duration: "",
  ordre: index + 1,
  visible: true,
  debloquerApresPrecedent: index > 0,
  ouvert: true,
  lessons: [creerLecon()],
});

const creerQuestion = () => ({
  enonce: "",
  type: "Choix unique",
  points: 1,
  explication: "",
  difficulte: "Facile",
  reponses: [
    { texte: "", correcte: true },
    { texte: "", correcte: false },
  ],
});

const creerQuiz = () => ({
  titre: "",
  scope: "Formation finale",
  instructions: "",
  dureeLimite: "",
  tentatives: 2,
  scoreMinimum: 70,
  melangerQuestions: true,
  melangerReponses: true,
  afficherCorrections: true,
  questions: [creerQuestion()],
});

const etatInitial = {
  titre: "",
  descriptionCourte: "",
  descriptionComplete: "",
  category: "Développement web",
  level: "beginner",
  image_url: "",
  duration: "",
  statut: "Brouillon",
  modules: [creerModule(0), creerModule(1)],
  quizzes: [creerQuiz()],
  progression: {
    mode: "séquentielle",
    scoreFinal: 70,
    terminerToutesLecons: true,
    reussirTousQuiz: false,
  },
};

function composerDescription(formulaire) {
  const blocs = [
    formulaire.descriptionCourte,
    formulaire.descriptionComplete,
  ];

  return blocs.filter(Boolean).join("\n\n");
}

function CreerAtelier() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(0);
  const [formulaire, setFormulaire] = useState(() => {
    try {
      const sauvegarde = localStorage.getItem(STORAGE_KEY);
      if (!sauvegarde) return etatInitial;
      const donnees = JSON.parse(sauvegarde);
      const progression = donnees.progression || {};
      return {
        ...etatInitial,
        ...donnees,
        progression: {
          mode: progression.mode === "libre" ? "libre" : etatInitial.progression.mode,
          scoreFinal: progression.scoreFinal ?? etatInitial.progression.scoreFinal,
          terminerToutesLecons: progression.terminerToutesLecons ?? etatInitial.progression.terminerToutesLecons,
          reussirTousQuiz: progression.reussirTousQuiz ?? etatInitial.progression.reussirTousQuiz,
        },
      };
    } catch {
      return etatInitial;
    }
  });
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(false);
  const [statutSauvegarde, setStatutSauvegarde] = useState("Toutes les modifications sont enregistrées");
  const [succes, setSucces] = useState(null);

  useEffect(() => {
    setStatutSauvegarde("Enregistrement en cours...");
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formulaire));
      setStatutSauvegarde("Toutes les modifications sont enregistrées");
    }, 600);

    return () => window.clearTimeout(timer);
  }, [formulaire]);

  const completion = useMemo(() => {
    const criteres = [
      formulaire.titre.trim(),
      formulaire.descriptionCourte.trim() || formulaire.descriptionComplete.trim(),
      formulaire.category.trim(),
      formulaire.image_url.trim(),
      formulaire.modules.length >= 2,
      formulaire.modules.every((module) => module.titre.trim() && module.lessons?.length && module.lessons.every((lecon) => lecon.titre.trim() && lecon.type)),
      formulaire.quizzes.every((quiz) => quiz.questions.every((question) => question.reponses.some((rep) => rep.correcte && rep.texte.trim()))),
      Number(formulaire.progression.scoreFinal) >= 0 && Number(formulaire.progression.scoreFinal) <= 100,
    ];

    return Math.round((criteres.filter(Boolean).length / criteres.length) * 100);
  }, [formulaire]);

  const changerChamp = (champ, valeur) => {
    setFormulaire((etat) => ({ ...etat, [champ]: valeur }));
  };

  const changerModule = (index, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: etat.modules.map((module, i) => (i === index ? { ...module, [champ]: valeur } : module)),
    }));
  };

  const ajouterModule = () => {
    setFormulaire((etat) => ({ ...etat, modules: [...etat.modules, creerModule(etat.modules.length)] }));
  };

  const dupliquerModule = (index) => {
    setFormulaire((etat) => {
      const copie = structuredClone(etat.modules[index]);
      copie.titre = `${copie.titre || `Module ${index + 1}`} - copie`;
      copie.ordre = etat.modules.length + 1;
      return { ...etat, modules: [...etat.modules, copie] };
    });
  };

  const supprimerModule = (index) => {
    if (!window.confirm("Supprimer ce module ?")) return;
    setFormulaire((etat) => ({ ...etat, modules: etat.modules.filter((_, i) => i !== index) }));
  };

  const changerLecon = (moduleIndex, leconIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: etat.modules.map((module, i) => {
        if (i !== moduleIndex) return module;
        return {
          ...module,
          lessons: module.lessons.map((lecon, j) => (j === leconIndex ? { ...lecon, [champ]: valeur } : lecon)),
        };
      }),
    }));
  };

  const ajouterLecon = (moduleIndex) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: etat.modules.map((module, i) => (
        i === moduleIndex ? { ...module, lessons: [...module.lessons, creerLecon(module.lessons.length)] } : module
      )),
    }));
  };

  const supprimerLecon = (moduleIndex, leconIndex) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    setFormulaire((etat) => ({
      ...etat,
      modules: etat.modules.map((module, i) => (
        i === moduleIndex ? { ...module, lessons: module.lessons.filter((_, j) => j !== leconIndex) } : module
      )),
    }));
  };

  const changerQuiz = (index, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      quizzes: etat.quizzes.map((quiz, i) => (i === index ? { ...quiz, [champ]: valeur } : quiz)),
    }));
  };

  const changerQuestion = (quizIndex, questionIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      quizzes: etat.quizzes.map((quiz, i) => {
        if (i !== quizIndex) return quiz;
        return {
          ...quiz,
          questions: quiz.questions.map((question, j) => (j === questionIndex ? { ...question, [champ]: valeur } : question)),
        };
      }),
    }));
  };

  const changerReponse = (quizIndex, questionIndex, reponseIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      quizzes: etat.quizzes.map((quiz, i) => {
        if (i !== quizIndex) return quiz;
        return {
          ...quiz,
          questions: quiz.questions.map((question, j) => {
            if (j !== questionIndex) return question;
            return {
              ...question,
              reponses: question.reponses.map((reponse, k) => (k === reponseIndex ? { ...reponse, [champ]: valeur } : reponse)),
            };
          }),
        };
      }),
    }));
  };

  const checklist = useMemo(() => [
    { label: "Informations générales complètes", ok: Boolean(formulaire.titre.trim() && formulaire.category.trim() && composerDescription(formulaire).trim()) },
    { label: "Image ajoutée", ok: Boolean(formulaire.image_url.trim()) },
    { label: "Minimum de 2 modules", ok: formulaire.modules.length >= 2 },
    { label: "Chaque module contient une leçon valide", ok: formulaire.modules.every((module) => module.titre.trim() && module.lessons?.length && module.lessons.every((lecon) => lecon.titre.trim() && lecon.type)) },
    { label: "Quiz avec bonnes réponses", ok: formulaire.quizzes.every((quiz) => quiz.questions.every((question) => question.reponses.some((rep) => rep.correcte && rep.texte.trim()))) },
    { label: "Score de réussite défini", ok: Number(formulaire.progression.scoreFinal) >= 0 && Number(formulaire.progression.scoreFinal) <= 100 },
  ], [formulaire]);

  const validerPublication = () => {
    const prochains = {};
    if (!formulaire.titre.trim()) prochains.titre = "Le titre est obligatoire.";
    if (!composerDescription(formulaire).trim()) prochains.description = "Ajoutez une description.";
    if (!formulaire.category.trim()) prochains.category = "La catégorie est obligatoire.";
    if (!formulaire.image_url.trim()) prochains.image_url = "Ajoutez une image de couverture.";
    if (!formulaire.duration || Number(formulaire.duration) < 1) prochains.duration = "La durée doit être positive.";
    if (formulaire.modules.length < 2) prochains.modules = "Ajoutez au minimum 2 modules.";

    formulaire.modules.forEach((module, moduleIndex) => {
      if (!module.titre.trim()) prochains[`module-${moduleIndex}`] = "Le titre du module est obligatoire.";
      if (!module.lessons?.length) prochains[`module-${moduleIndex}`] = "Chaque module doit contenir au moins une leçon.";
      module.lessons?.forEach((lecon, leconIndex) => {
        if (!lecon.titre.trim() || !lecon.type) {
          prochains[`lesson-${moduleIndex}-${leconIndex}`] = "Titre et type de leçon obligatoires.";
        }
      });
    });

    formulaire.quizzes.forEach((quiz, quizIndex) => {
      quiz.questions.forEach((question, questionIndex) => {
        if (!question.enonce.trim()) prochains[`question-${quizIndex}-${questionIndex}`] = "L’énoncé est obligatoire.";
        if (!question.reponses.some((rep) => rep.correcte && rep.texte.trim())) {
          prochains[`question-${quizIndex}-${questionIndex}`] = "Sélectionnez au moins une bonne réponse.";
        }
      });
    });

    return prochains;
  };

  const publier = async (statut = "Publié") => {
    const prochains = statut === "Publié" ? validerPublication() : {};

    if (Object.keys(prochains).length > 0) {
      setErreurs(prochains);
      setEtape(0);
      return;
    }

    if (statut === "Publié" && !window.confirm("Publier cette formation ?")) return;

    setChargement(true);
    setErreurs({});

    try {
      const payload = {
        titre: formulaire.titre.trim(),
        description: composerDescription(formulaire),
        category: formulaire.category,
        date: new Date().toISOString().slice(0, 10),
        statut,
        duration: Number(formulaire.duration || 1),
        level: formulaire.level === "all" ? "beginner" : formulaire.level,
        image_url: formulaire.image_url.trim() || null,
        modules: formulaire.modules.map((module) => ({
          titre: module.titre.trim(),
          contenu: JSON.stringify({
            description: module.description,
            duration: module.duration,
            visible: module.visible,
            debloquerApresPrecedent: module.debloquerApresPrecedent,
            lessons: module.lessons,
            quizzes: formulaire.quizzes.filter((quiz) => quiz.scope === module.titre),
            progression: formulaire.progression,
          }),
        })),
      };

      const formationCreee = await creerFormation(payload);
      localStorage.removeItem(STORAGE_KEY);

      if (statut === "Publié") {
        setSucces(formationCreee);
      } else {
        navigate("/dashboard/formateur", { replace: true });
      }
    } catch (e) {
      setErreurs({ general: e.response?.data?.message || "Impossible d’enregistrer cette formation." });
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area">
        <DashboardNavbar />

        <section className="page-content create-course-page course-builder-pro" aria-labelledby="page-title">
          <div className="builder-hero">
            <div>
              <span className="dashboard-eyebrow">Dashboard formateur</span>
              <h2 id="page-title">Ajouter une formation</h2>
              <p>Construisez une formation complète avec modules, leçons, quiz, règles de progression et aperçu avant publication.</p>
            </div>
            <div className="builder-progress-card" aria-label={`Complétion ${completion}%`}>
              <strong>{completion}%</strong>
              <span>complété</span>
              <div className="builder-progress-line"><i style={{ width: `${completion}%` }} /></div>
              <small>{statutSauvegarde}</small>
            </div>
          </div>

          {erreurs.general && <p className="error builder-global-error">{erreurs.general}</p>}

          <div className="course-builder-shell course-builder-shell--pro">
            <aside className="course-builder-steps course-builder-steps--pro" aria-label="Étapes de création">
              {ETAPES.map((item, index) => (
                <button
                  type="button"
                  key={item.titre}
                  className={`builder-step ${index === etape ? "is-active" : ""} ${index < etape ? "is-done" : ""}`}
                  onClick={() => setEtape(index)}
                >
                  <span>{index < etape ? <FontAwesomeIcon icon={faCheck} /> : index + 1}</span>
                  <div>
                    <strong>{item.titre}</strong>
                    <p>{item.aide}</p>
                  </div>
                </button>
              ))}
            </aside>

            <form className="form-create form-create--course builder-form" onSubmit={(event) => event.preventDefault()} noValidate>
              {etape === 0 && (
                <section className="form-section builder-step-panel">
                  <h3>Informations générales</h3>
                  <div className="form-grid">
                    <label>
                      Titre
                      <input value={formulaire.titre} onChange={(event) => changerChamp("titre", event.target.value)} placeholder="Ex : React professionnel" />
                      {erreurs.titre && <p className="form-error">{erreurs.titre}</p>}
                    </label>

                    <label>
                      Description courte
                      <input value={formulaire.descriptionCourte} onChange={(event) => changerChamp("descriptionCourte", event.target.value)} placeholder="Résumé clair de la formation" />
                    </label>

                    <label>
                      Catégorie
                      <select value={formulaire.category} onChange={(event) => changerChamp("category", event.target.value)}>
                        <option value="Développement web">Développement web</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Management">Management</option>
                        <option value="Data">Data</option>
                        <option value="DevOps">DevOps</option>
                      </select>
                    </label>

                    <label>
                      Niveau
                      <select value={formulaire.level} onChange={(event) => changerChamp("level", event.target.value)}>
                        <option value="beginner">Débutant</option>
                        <option value="intermediaire">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                        <option value="all">Tous niveaux</option>
                      </select>
                    </label>

                    <label>
                      Durée estimée en heures
                      <input type="number" min="1" value={formulaire.duration} onChange={(event) => changerChamp("duration", event.target.value)} />
                      {erreurs.duration && <p className="form-error">{erreurs.duration}</p>}
                    </label>

                    <label>
                      Statut
                      <select value={formulaire.statut} onChange={(event) => changerChamp("statut", event.target.value)}>
                        <option value="Brouillon">Brouillon</option>
                        <option value="Publié">Publié</option>
                        <option value="Archivé">Archivé</option>
                      </select>
                    </label>

                    <label className="form-field-wide">
                      Description complète
                      <textarea value={formulaire.descriptionComplete} onChange={(event) => changerChamp("descriptionComplete", event.target.value)} placeholder="Ajoutez une description détaillée, les bénéfices et le contexte de la formation." />
                      {erreurs.description && <p className="form-error">{erreurs.description}</p>}
                    </label>
                  </div>

                  <div className="builder-upload-grid">
                    <label className="builder-upload-zone">
                      <FontAwesomeIcon icon={faImage} />
                      <strong>Image de couverture</strong>
                      <span>JPG, PNG, WebP — collez l’URL de l’image</span>
                      <input value={formulaire.image_url} onChange={(event) => changerChamp("image_url", event.target.value)} placeholder="https://exemple.com/image.jpg" />
                      {erreurs.image_url && <p className="form-error">{erreurs.image_url}</p>}
                    </label>
                    <div className="builder-cover-preview">
                      {formulaire.image_url ? <img src={formulaire.image_url} alt="Aperçu couverture" /> : <FontAwesomeIcon icon={faImage} />}
                    </div>
                  </div>
                </section>
              )}

              {etape === 1 && (
                <section className="form-section builder-step-panel">
                  <div className="builder-inline-head">
                    <div>
                      <h3>Programme, modules et leçons</h3>
                      <p className="builder-muted">Minimum 2 modules. Chaque module doit contenir au moins une leçon.</p>
                    </div>
                    <button type="button" className="btn-create btn-compact" onClick={ajouterModule}>
                      <FontAwesomeIcon icon={faPlus} /> Ajouter un module
                    </button>
                  </div>
                  {erreurs.modules && <p className="form-error">{erreurs.modules}</p>}

                  <div className="builder-modules-list">
                    {formulaire.modules.map((module, moduleIndex) => (
                      <article className="module-editor-block builder-module-card" key={`module-${moduleIndex}`}>
                        <div className="module-editor-head">
                          <button type="button" className="builder-accordion-title" onClick={() => changerModule(moduleIndex, "ouvert", !module.ouvert)}>
                            <FontAwesomeIcon icon={faLayerGroup} />
                            <strong>Module {moduleIndex + 1}</strong>
                            <FontAwesomeIcon icon={faChevronDown} />
                          </button>
                          <div className="builder-module-actions">
                            <button type="button" className="builder-icon-btn" onClick={() => dupliquerModule(moduleIndex)} aria-label="Dupliquer le module"><FontAwesomeIcon icon={faCopy} /></button>
                            {formulaire.modules.length > 2 && (
                              <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerModule(moduleIndex)} aria-label="Supprimer le module"><FontAwesomeIcon icon={faTrash} /></button>
                            )}
                          </div>
                        </div>

                        {module.ouvert && (
                          <>
                            <div className="form-grid">
                              <label>
                                Titre du module
                                <input value={module.titre} onChange={(event) => changerModule(moduleIndex, "titre", event.target.value)} />
                                {erreurs[`module-${moduleIndex}`] && <p className="form-error">{erreurs[`module-${moduleIndex}`]}</p>}
                              </label>
                              <label>
                                Durée estimée
                                <input type="number" min="1" value={module.duration} onChange={(event) => changerModule(moduleIndex, "duration", event.target.value)} />
                              </label>
                              <label className="form-field-wide">
                                Description du module
                                <textarea value={module.description} onChange={(event) => changerModule(moduleIndex, "description", event.target.value)} />
                              </label>
                              <label className="builder-check">
                                <input type="checkbox" checked={module.visible} onChange={(event) => changerModule(moduleIndex, "visible", event.target.checked)} />
                                Module visible
                              </label>
                              <label className="builder-check">
                                <input type="checkbox" checked={module.debloquerApresPrecedent} onChange={(event) => changerModule(moduleIndex, "debloquerApresPrecedent", event.target.checked)} />
                                Débloquer après le module précédent
                              </label>
                            </div>

                            <div className="builder-lessons">
                              <div className="builder-inline-head">
                                <h4>Leçons</h4>
                                <button type="button" className="btn-secondary btn-compact" onClick={() => ajouterLecon(moduleIndex)}>
                                  <FontAwesomeIcon icon={faPlus} /> Ajouter une leçon
                                </button>
                              </div>
                              {module.lessons.map((lecon, leconIndex) => (
                                <div className="builder-lesson-card" key={`lesson-${moduleIndex}-${leconIndex}`}>
                                  <div className="builder-inline-head">
                                    <strong>Leçon {leconIndex + 1}</strong>
                                    {module.lessons.length > 1 && (
                                      <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerLecon(moduleIndex, leconIndex)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                      </button>
                                    )}
                                  </div>
                                  <div className="form-grid">
                                    <label>
                                      Titre
                                      <input value={lecon.titre} onChange={(event) => changerLecon(moduleIndex, leconIndex, "titre", event.target.value)} />
                                    </label>
                                    <label>
                                      Type
                                      <select value={lecon.type} onChange={(event) => changerLecon(moduleIndex, leconIndex, "type", event.target.value)}>
                                        {TYPES_LECONS.map((type) => <option key={type} value={type}>{type}</option>)}
                                      </select>
                                    </label>
                                    <label>
                                      Durée
                                      <input type="number" min="1" value={lecon.duration} onChange={(event) => changerLecon(moduleIndex, leconIndex, "duration", event.target.value)} />
                                    </label>
                                    <label className="form-field-wide">
                                      Contenu principal
                                      <textarea value={lecon.contenu} onChange={(event) => changerLecon(moduleIndex, leconIndex, "contenu", event.target.value)} placeholder="Texte, consigne, lien, résumé ou contenu de la leçon." />
                                    </label>
                                    {(lecon.type === "Vidéo" || lecon.type === "Lien externe") && (
                                      <label>
                                        URL externe
                                        <input value={lecon.videoUrl} onChange={(event) => changerLecon(moduleIndex, leconIndex, "videoUrl", event.target.value)} />
                                      </label>
                                    )}
                                    <label className="builder-check">
                                      <input type="checkbox" checked={lecon.obligatoire} onChange={(event) => changerLecon(moduleIndex, leconIndex, "obligatoire", event.target.checked)} />
                                      Obligatoire
                                    </label>
                                    <label className="builder-check">
                                      <input type="checkbox" checked={lecon.preview} onChange={(event) => changerLecon(moduleIndex, leconIndex, "preview", event.target.checked)} />
                                      Aperçu gratuit
                                    </label>
                                  </div>
                                  {erreurs[`lesson-${moduleIndex}-${leconIndex}`] && <p className="form-error">{erreurs[`lesson-${moduleIndex}-${leconIndex}`]}</p>}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {etape === 2 && (
                <section className="form-section builder-step-panel">
                  <div className="builder-inline-head">
                    <div>
                      <h3>Quiz et évaluations</h3>
                      <p className="builder-muted">Ajoutez des questions, réponses, points et score de réussite.</p>
                    </div>
                    <button type="button" className="btn-create btn-compact" onClick={() => setFormulaire((etat) => ({ ...etat, quizzes: [...etat.quizzes, creerQuiz()] }))}>
                      <FontAwesomeIcon icon={faPlus} /> Ajouter un quiz
                    </button>
                  </div>

                  {formulaire.quizzes.map((quiz, quizIndex) => (
                    <article className="builder-quiz-card" key={`quiz-${quizIndex}`}>
                      <div className="form-grid">
                        <label>
                          Titre du quiz
                          <input value={quiz.titre} onChange={(event) => changerQuiz(quizIndex, "titre", event.target.value)} />
                        </label>
                        <label>
                          Score minimum (%)
                          <input type="number" min="0" max="100" value={quiz.scoreMinimum} onChange={(event) => changerQuiz(quizIndex, "scoreMinimum", event.target.value)} />
                        </label>
                        <label>
                          Tentatives max
                          <input type="number" min="1" value={quiz.tentatives} onChange={(event) => changerQuiz(quizIndex, "tentatives", event.target.value)} />
                        </label>
                        <label className="form-field-wide">
                          Instructions
                          <textarea value={quiz.instructions} onChange={(event) => changerQuiz(quizIndex, "instructions", event.target.value)} />
                        </label>
                      </div>

                      <div className="builder-quiz-stats">
                        <span>{quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""}</span>
                        <span>{quiz.questions.reduce((total, question) => total + Number(question.points || 0), 0)} points</span>
                        <span>Réussite : {quiz.scoreMinimum}%</span>
                      </div>

                      {quiz.questions.map((question, questionIndex) => (
                        <div className="builder-question-card" key={`question-${quizIndex}-${questionIndex}`}>
                          <div className="form-grid">
                            <label className="form-field-wide">
                              Énoncé
                              <input value={question.enonce} onChange={(event) => changerQuestion(quizIndex, questionIndex, "enonce", event.target.value)} />
                            </label>
                            <label>
                              Type
                              <select value={question.type} onChange={(event) => changerQuestion(quizIndex, questionIndex, "type", event.target.value)}>
                                {QUESTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                              </select>
                            </label>
                            <label>
                              Points
                              <input type="number" min="1" value={question.points} onChange={(event) => changerQuestion(quizIndex, questionIndex, "points", event.target.value)} />
                            </label>
                          </div>

                          <div className="builder-answers">
                            {question.reponses.map((reponse, reponseIndex) => (
                              <label className="builder-answer-row" key={`answer-${quizIndex}-${questionIndex}-${reponseIndex}`}>
                                <input type="checkbox" checked={reponse.correcte} onChange={(event) => changerReponse(quizIndex, questionIndex, reponseIndex, "correcte", event.target.checked)} />
                                <input value={reponse.texte} onChange={(event) => changerReponse(quizIndex, questionIndex, reponseIndex, "texte", event.target.value)} placeholder={`Réponse ${reponseIndex + 1}`} />
                              </label>
                            ))}
                            <button
                              type="button"
                              className="btn-secondary btn-compact"
                              onClick={() => changerQuestion(quizIndex, questionIndex, "reponses", [...question.reponses, { texte: "", correcte: false }])}
                            >
                              Ajouter une réponse
                            </button>
                          </div>
                          {erreurs[`question-${quizIndex}-${questionIndex}`] && <p className="form-error">{erreurs[`question-${quizIndex}-${questionIndex}`]}</p>}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-secondary btn-compact"
                        onClick={() => changerQuiz(quizIndex, "questions", [...quiz.questions, creerQuestion()])}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Ajouter une question
                      </button>
                    </article>
                  ))}
                </section>
              )}

              {etape === 3 && (
                <section className="form-section builder-step-panel">
                  <h3>Progression du parcours</h3>
                  <p className="builder-muted">Choisissez uniquement comment l’apprenant avance dans la formation.</p>
                  <div className="form-grid">
                    <label>
                      Règle du parcours
                      <select value={formulaire.progression.mode} onChange={(event) => setFormulaire((etat) => ({ ...etat, progression: { ...etat.progression, mode: event.target.value } }))}>
                        <option value="libre">Libre : l’apprenant peut ouvrir toutes les leçons</option>
                        <option value="séquentielle">Séquentielle : avancer dans l’ordre</option>
                      </select>
                    </label>
                    <label>
                      Score minimum au quiz (%)
                      <input type="number" min="0" max="100" value={formulaire.progression.scoreFinal} onChange={(event) => setFormulaire((etat) => ({ ...etat, progression: { ...etat.progression, scoreFinal: event.target.value } }))} />
                    </label>
                    <label className="builder-check">
                      <input type="checkbox" checked={formulaire.progression.terminerToutesLecons} onChange={(event) => setFormulaire((etat) => ({ ...etat, progression: { ...etat.progression, terminerToutesLecons: event.target.checked } }))} />
                      Demander de terminer toutes les leçons
                    </label>
                    <label className="builder-check">
                      <input type="checkbox" checked={formulaire.progression.reussirTousQuiz} onChange={(event) => setFormulaire((etat) => ({ ...etat, progression: { ...etat.progression, reussirTousQuiz: event.target.checked } }))} />
                      Demander de réussir les quiz
                    </label>
                  </div>
                </section>
              )}
              {etape === 4 && (
                <section className="form-section builder-step-panel">
                  <h3>Aperçu et publication</h3>
                  <div className="builder-preview-grid">
                    <article className="builder-preview-card">
                      {formulaire.image_url ? <img src={formulaire.image_url} alt="" /> : <div className="builder-preview-empty"><FontAwesomeIcon icon={faImage} /></div>}
                      <div>
                        <span className="dashboard-badge">{formulaire.category}</span>
                        <h4>{formulaire.titre || "Titre de la formation"}</h4>
                        <p>{formulaire.descriptionCourte || formulaire.descriptionComplete || "Courte description de la formation."}</p>
                        <div className="builder-preview-meta">
                          <span><FontAwesomeIcon icon={faLayerGroup} /> {formulaire.modules.length} modules</span>
                          <span><FontAwesomeIcon icon={faBookOpen} /> {formulaire.modules.reduce((total, module) => total + module.lessons.length, 0)} leçons</span>
                          <span><FontAwesomeIcon icon={faQuestionCircle} /> {formulaire.quizzes.length} quiz</span>
                        </div>
                      </div>
                    </article>

                    <aside className="builder-checklist">
                      <h4>Checklist avant publication</h4>
                      {checklist.map((item) => (
                        <button type="button" key={item.label} className={item.ok ? "is-ok" : "is-missing"} onClick={() => !item.ok && setEtape(0)}>
                          <FontAwesomeIcon icon={item.ok ? faCheck : faTriangleExclamation} />
                          {item.label}
                        </button>
                      ))}
                    </aside>
                  </div>
                </section>
              )}

              <div className="builder-actions-bar">
                <Link to="/dashboard/formateur" className="btn-secondary">
                  <FontAwesomeIcon icon={faXmark} /> Annuler
                </Link>
                <button type="button" className="btn-secondary" onClick={() => publier("Brouillon")} disabled={chargement}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer comme brouillon
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEtape((actuel) => Math.max(actuel - 1, 0))} disabled={etape === 0}>
                  <FontAwesomeIcon icon={faArrowLeft} /> Étape précédente
                </button>
                {etape < ETAPES.length - 1 ? (
                  <button type="button" className="btn-create" onClick={() => setEtape((actuel) => Math.min(actuel + 1, ETAPES.length - 1))}>
                    Étape suivante <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                ) : (
                  <button type="button" className="btn-create" onClick={() => publier("Publié")} disabled={chargement}>
                    <FontAwesomeIcon icon={faRocket} /> {chargement ? "Publication..." : "Publier la formation"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>

      {succes && (
        <div className="builder-success-overlay" role="dialog" aria-modal="true" aria-labelledby="publish-success-title">
          <div className="builder-success-modal">
            <div className="builder-success-icon"><FontAwesomeIcon icon={faCheck} /></div>
            <h3 id="publish-success-title">Formation publiée avec succès</h3>
            <p>{succes.titre || formulaire.titre}</p>
            <div className="modal-actions">
              <button type="button" className="btn-create" onClick={() => navigate(`/formation/${succes.id}`)}>Voir la formation</button>
              <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard/formateur")}>Retour au dashboard</button>
              <button type="button" className="btn-secondary" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/formation/${succes.id}`)}>
                <FontAwesomeIcon icon={faFileArrowDown} /> Partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreerAtelier;
