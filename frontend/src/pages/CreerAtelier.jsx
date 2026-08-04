import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBookOpen,
  faCheck,
  faCopy,
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
  { titre: "Informations générales", aide: "Titre, image, catégorie" },
  { titre: "Modules et leçons", aide: "Parcours du cours" },
  { titre: "Quiz de fin", aide: "2 à 3 quiz finaux" },
  { titre: "Aperçu et publication", aide: "Checklist finale" },
];

const TYPES_LECONS = ["Texte", "Vidéo", "Document PDF"];
const TYPES_QUESTIONS = ["Choix unique", "Choix multiples", "Vrai ou faux"];
const NIVEAUX = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
];

const creerLecon = (index = 0) => ({
  titre: "",
  type: "Texte",
  description: "",
  duration: "",
  position: index + 1,
  contenu: "",
  videoUrl: "",
  pdfUrl: "",
});

const creerModule = (index = 0) => ({
  titre: "",
  description: "",
  duration: "",
  position: index + 1,
  ouvert: true,
  lessons: [creerLecon()],
});

const creerReponses = () => [
  { texte: "", correcte: true, position: 1 },
  { texte: "", correcte: false, position: 2 },
];

const creerQuestion = (index = 0) => ({
  enonce: "",
  type: "Choix unique",
  points: 1,
  position: index + 1,
  reponses: creerReponses(),
});

const creerQuiz = (index = 0) => ({
  titre: "",
  description: "",
  scoreMinimum: 70,
  tentatives: 2,
  position: index + 1,
  questions: [creerQuestion()],
});

const etatInitial = {
  titre: "",
  descriptionCourte: "",
  descriptionComplete: "",
  image_url: "",
  category: "Développement web",
  level: "beginner",
  langue: "Français",
  duration: "",
  modules: [creerModule(0), creerModule(1), creerModule(2)],
  quizzes: [creerQuiz(0), creerQuiz(1)],
};

function composerDescription(formulaire) {
  return [formulaire.descriptionCourte, formulaire.descriptionComplete].filter(Boolean).join("\n\n");
}

function remplacerElement(liste, indexCible, transformer) {
  return liste.map((element, index) => (index === indexCible ? transformer(element) : element));
}

function deplacerElement(liste, index, direction) {
  const cible = index + direction;
  if (cible < 0 || cible >= liste.length) return liste;
  const copie = [...liste];
  [copie[index], copie[cible]] = [copie[cible], copie[index]];
  return copie.map((element, ordre) => ({ ...element, position: ordre + 1 }));
}

function lireBrouillon() {
  try {
    const sauvegarde = localStorage.getItem(STORAGE_KEY);
    return sauvegarde ? { ...etatInitial, ...JSON.parse(sauvegarde) } : etatInitial;
  } catch {
    return etatInitial;
  }
}

function nettoyerLecon(lecon, index) {
  return {
    titre: lecon.titre.trim(),
    type: TYPES_LECONS.includes(lecon.type) ? lecon.type : "Texte",
    description: lecon.description.trim(),
    duration: Number(lecon.duration || 1),
    position: index + 1,
    contenu: lecon.contenu.trim(),
    videoUrl: lecon.videoUrl.trim(),
    pdfUrl: lecon.pdfUrl.trim(),
  };
}

function nettoyerQuiz(quiz, index) {
  return {
    titre: quiz.titre.trim(),
    description: quiz.description.trim(),
    scoreMinimum: Number(quiz.scoreMinimum || 70),
    tentatives: Number(quiz.tentatives || 1),
    position: index + 1,
    questions: quiz.questions.map((question, questionIndex) => ({
      enonce: question.enonce.trim(),
      type: TYPES_QUESTIONS.includes(question.type) ? question.type : "Choix unique",
      points: Number(question.points || 1),
      position: questionIndex + 1,
      reponses: question.reponses.map((reponse, reponseIndex) => ({
        texte: reponse.texte.trim(),
        correcte: Boolean(reponse.correcte),
        position: reponseIndex + 1,
      })),
    })),
  };
}

function CreerAtelier() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(0);
  const [formulaire, setFormulaire] = useState(lireBrouillon);
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(false);
  const [statutSauvegarde, setStatutSauvegarde] = useState("Brouillon local prêt");
  const [succes, setSucces] = useState(null);

  useEffect(() => {
    setStatutSauvegarde("Enregistrement local...");
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formulaire));
      setStatutSauvegarde("Brouillon local enregistré");
    }, 500);

    return () => window.clearTimeout(timer);
  }, [formulaire]);

  const totalLecons = useMemo(
    () => formulaire.modules.reduce((total, module) => total + module.lessons.length, 0),
    [formulaire.modules],
  );

  const totalQuestions = useMemo(
    () => formulaire.quizzes.reduce((total, quiz) => total + quiz.questions.length, 0),
    [formulaire.quizzes],
  );

  const checklist = useMemo(() => [
    { label: "Informations générales complètes", ok: Boolean(formulaire.titre.trim() && composerDescription(formulaire).trim() && formulaire.category.trim() && formulaire.duration) },
    { label: "Image ajoutée", ok: Boolean(formulaire.image_url.trim()) },
    { label: "Minimum 3 modules", ok: formulaire.modules.length >= 3 },
    { label: "Chaque module possède au moins une leçon", ok: formulaire.modules.every((module) => module.titre.trim() && module.lessons.length > 0) },
    { label: "Entre 2 et 3 quiz", ok: formulaire.quizzes.length >= 2 && formulaire.quizzes.length <= 3 },
    { label: "Chaque quiz possède au moins une question", ok: formulaire.quizzes.every((quiz) => quiz.titre.trim() && quiz.questions.length > 0) },
    { label: "Toutes les questions possèdent une bonne réponse", ok: formulaire.quizzes.every((quiz) => quiz.questions.every((question) => question.enonce.trim() && question.reponses.length >= 2 && question.reponses.some((reponse) => reponse.correcte && reponse.texte.trim()))) },
  ], [formulaire]);

  const completion = Math.round((checklist.filter((item) => item.ok).length / checklist.length) * 100);

  const changerChamp = (champ, valeur) => setFormulaire((etat) => ({ ...etat, [champ]: valeur }));

  const changerModule = (moduleIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: remplacerElement(etat.modules, moduleIndex, (module) => ({ ...module, [champ]: valeur })),
    }));
  };

  const changerLecon = (moduleIndex, leconIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: remplacerElement(etat.modules, moduleIndex, (module) => ({
        ...module,
        lessons: remplacerElement(module.lessons, leconIndex, (lecon) => ({ ...lecon, [champ]: valeur })),
      })),
    }));
  };

  const changerQuiz = (quizIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      quizzes: remplacerElement(etat.quizzes, quizIndex, (quiz) => ({ ...quiz, [champ]: valeur })),
    }));
  };

  const changerQuestion = (quizIndex, questionIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      quizzes: remplacerElement(etat.quizzes, quizIndex, (quiz) => ({
        ...quiz,
        questions: remplacerElement(quiz.questions, questionIndex, (question) => ({ ...question, [champ]: valeur })),
      })),
    }));
  };

  const changerReponse = (quizIndex, questionIndex, reponseIndex, champ, valeur) => {
    setFormulaire((etat) => ({
      ...etat,
      quizzes: remplacerElement(etat.quizzes, quizIndex, (quiz) => ({
        ...quiz,
        questions: remplacerElement(quiz.questions, questionIndex, (question) => ({
          ...question,
          reponses: remplacerElement(question.reponses, reponseIndex, (reponse) => ({ ...reponse, [champ]: valeur })),
        })),
      })),
    }));
  };

  const ajouterModule = () => setFormulaire((etat) => ({ ...etat, modules: [...etat.modules, creerModule(etat.modules.length)] }));
  const ajouterLecon = (moduleIndex) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: remplacerElement(etat.modules, moduleIndex, (module) => ({
        ...module,
        lessons: [...module.lessons, creerLecon(module.lessons.length)],
      })),
    }));
  };
  const ajouterQuiz = () => {
    setFormulaire((etat) => (etat.quizzes.length >= 3 ? etat : { ...etat, quizzes: [...etat.quizzes, creerQuiz(etat.quizzes.length)] }));
  };

  const supprimerModule = (index) => {
    if (formulaire.modules.length <= 3 || !window.confirm("Supprimer ce module ?")) return;
    setFormulaire((etat) => ({ ...etat, modules: etat.modules.filter((_, i) => i !== index) }));
  };

  const supprimerLecon = (moduleIndex, leconIndex) => {
    const module = formulaire.modules[moduleIndex];
    if (module.lessons.length <= 1 || !window.confirm("Supprimer cette leçon ?")) return;
    setFormulaire((etat) => ({
      ...etat,
      modules: remplacerElement(etat.modules, moduleIndex, (item) => ({
        ...item,
        lessons: item.lessons.filter((_, i) => i !== leconIndex),
      })),
    }));
  };

  const supprimerQuiz = (index) => {
    if (formulaire.quizzes.length <= 2 || !window.confirm("Supprimer ce quiz ?")) return;
    setFormulaire((etat) => ({ ...etat, quizzes: etat.quizzes.filter((_, i) => i !== index) }));
  };

  const dupliquerModule = (index) => {
    setFormulaire((etat) => {
      const copie = structuredClone(etat.modules[index]);
      copie.titre = `${copie.titre || `Module ${index + 1}`} - copie`;
      copie.position = etat.modules.length + 1;
      return { ...etat, modules: [...etat.modules, copie] };
    });
  };

  const deplacerModule = (index, direction) => setFormulaire((etat) => ({ ...etat, modules: deplacerElement(etat.modules, index, direction) }));
  const deplacerLecon = (moduleIndex, leconIndex, direction) => {
    setFormulaire((etat) => ({
      ...etat,
      modules: remplacerElement(etat.modules, moduleIndex, (module) => ({
        ...module,
        lessons: deplacerElement(module.lessons, leconIndex, direction),
      })),
    }));
  };

  const ajouterQuestion = (quizIndex) => changerQuiz(quizIndex, "questions", [...formulaire.quizzes[quizIndex].questions, creerQuestion(formulaire.quizzes[quizIndex].questions.length)]);
  const supprimerQuestion = (quizIndex, questionIndex) => {
    const quiz = formulaire.quizzes[quizIndex];
    if (quiz.questions.length <= 1 || !window.confirm("Supprimer cette question ?")) return;
    changerQuiz(quizIndex, "questions", quiz.questions.filter((_, index) => index !== questionIndex));
  };

  const ajouterReponse = (quizIndex, questionIndex) => {
    const question = formulaire.quizzes[quizIndex].questions[questionIndex];
    changerQuestion(quizIndex, questionIndex, "reponses", [...question.reponses, { texte: "", correcte: false, position: question.reponses.length + 1 }]);
  };

  const supprimerReponse = (quizIndex, questionIndex, reponseIndex) => {
    const question = formulaire.quizzes[quizIndex].questions[questionIndex];
    if (question.reponses.length <= 2) return;
    changerQuestion(quizIndex, questionIndex, "reponses", question.reponses.filter((_, index) => index !== reponseIndex));
  };

  const validerPublication = () => {
    const prochains = {};
    checklist.forEach((item) => {
      if (!item.ok) prochains.general = "Complétez la checklist avant de publier.";
    });
    if (!formulaire.titre.trim()) prochains.titre = "Le titre est obligatoire.";
    if (!composerDescription(formulaire).trim()) prochains.description = "La description est obligatoire.";
    if (!formulaire.image_url.trim()) prochains.image_url = "Ajoutez une image.";
    if (!formulaire.duration || Number(formulaire.duration) < 1) prochains.duration = "La durée doit être positive.";
    return prochains;
  };

  const construirePayload = (statut) => {
    const quizzes = formulaire.quizzes.map(nettoyerQuiz);
    return {
      titre: formulaire.titre.trim(),
      description: composerDescription(formulaire),
      category: formulaire.category.trim(),
      date: new Date().toISOString().slice(0, 10),
      statut,
      duration: Number(formulaire.duration || 1),
      level: formulaire.level,
      image_url: formulaire.image_url.trim() || null,
      modules: formulaire.modules.map((module, moduleIndex) => ({
        titre: module.titre.trim() || `Module ${moduleIndex + 1}`,
        contenu: JSON.stringify({
          description: module.description.trim(),
          duration: Number(module.duration || 1),
          position: moduleIndex + 1,
          lessons: module.lessons.map(nettoyerLecon),
          finalQuizzes: moduleIndex === formulaire.modules.length - 1 ? quizzes : [],
        }),
      })),
    };
  };

  const enregistrer = async (statut = "Brouillon") => {
    const prochains = statut === "Publié" ? validerPublication() : {};
    if (Object.keys(prochains).length > 0) {
      setErreurs(prochains);
      return;
    }

    setChargement(true);
    setErreurs({});
    try {
      const formation = await creerFormation(construirePayload(statut));
      localStorage.removeItem(STORAGE_KEY);
      if (statut === "Publié") setSucces(formation);
      else navigate("/dashboard/formateur", { replace: true });
    } catch (error) {
      setErreurs({ general: error.response?.data?.message || "Impossible d’enregistrer cette formation." });
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
              <p>Un parcours clair : informations, modules, leçons, puis 2 ou 3 quiz de fin de formation.</p>
            </div>
            <div className="builder-progress-card">
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
                <button type="button" key={item.titre} className={`builder-step ${index === etape ? "is-active" : ""} ${index < etape ? "is-done" : ""}`} onClick={() => setEtape(index)}>
                  <span>{index < etape ? <FontAwesomeIcon icon={faCheck} /> : index + 1}</span>
                  <div><strong>{item.titre}</strong><p>{item.aide}</p></div>
                </button>
              ))}
            </aside>

            <form className="form-create form-create--course builder-form" onSubmit={(event) => event.preventDefault()} noValidate>
              {etape === 0 && (
                <section className="form-section builder-step-panel">
                  <h3>Informations générales</h3>
                  <div className="form-grid">
                    <label>Titre de la formation<input value={formulaire.titre} onChange={(event) => changerChamp("titre", event.target.value)} placeholder="Ex : Laravel et API REST" />{erreurs.titre && <p className="form-error">{erreurs.titre}</p>}</label>
                    <label>Description courte<input value={formulaire.descriptionCourte} onChange={(event) => changerChamp("descriptionCourte", event.target.value)} placeholder="Résumé clair de la formation" /></label>
                    <label>Catégorie<input value={formulaire.category} onChange={(event) => changerChamp("category", event.target.value)} /></label>
                    <label>Niveau<select value={formulaire.level} onChange={(event) => changerChamp("level", event.target.value)}>{NIVEAUX.map((niveau) => <option key={niveau.value} value={niveau.value}>{niveau.label}</option>)}</select></label>
                    <label>Langue<input value={formulaire.langue} disabled /></label>
                    <label>Durée estimée en heures<input type="number" min="1" value={formulaire.duration} onChange={(event) => changerChamp("duration", event.target.value)} />{erreurs.duration && <p className="form-error">{erreurs.duration}</p>}</label>
                    <label className="form-field-wide">Description complète<textarea value={formulaire.descriptionComplete} onChange={(event) => changerChamp("descriptionComplete", event.target.value)} placeholder="Expliquez le contenu, le contexte et ce que l’apprenant va pratiquer." />{erreurs.description && <p className="form-error">{erreurs.description}</p>}</label>
                  </div>
                  <div className="builder-upload-grid">
                    <label className="builder-upload-zone"><FontAwesomeIcon icon={faImage} /><strong>Image de couverture</strong><span>Collez l’URL d’une image JPG, PNG ou WebP</span><input value={formulaire.image_url} onChange={(event) => changerChamp("image_url", event.target.value)} placeholder="https://exemple.com/image.jpg" />{erreurs.image_url && <p className="form-error">{erreurs.image_url}</p>}</label>
                    <div className="builder-cover-preview">{formulaire.image_url ? <img src={formulaire.image_url} alt="Aperçu couverture" /> : <FontAwesomeIcon icon={faImage} />}</div>
                  </div>
                </section>
              )}

              {etape === 1 && (
                <section className="form-section builder-step-panel">
                  <div className="builder-inline-head"><div><h3>Modules et leçons</h3><p className="builder-muted">Minimum 3 modules. Chaque module contient au moins une leçon.</p></div><button type="button" className="btn-create btn-compact" onClick={ajouterModule}><FontAwesomeIcon icon={faPlus} /> Ajouter un module</button></div>
                  <div className="builder-modules-list">
                    {formulaire.modules.map((module, moduleIndex) => (
                      <article className="module-editor-block builder-module-card" key={`module-${moduleIndex}`}>
                        <div className="module-editor-head">
                          <button type="button" className="builder-accordion-title" onClick={() => changerModule(moduleIndex, "ouvert", !module.ouvert)}><FontAwesomeIcon icon={faLayerGroup} /><strong>Module {moduleIndex + 1}</strong><span>{module.lessons.length} leçon{module.lessons.length > 1 ? "s" : ""}</span></button>
                          <div className="builder-module-actions">
                            <button type="button" className="builder-icon-btn" onClick={() => deplacerModule(moduleIndex, -1)} disabled={moduleIndex === 0} aria-label="Monter"><FontAwesomeIcon icon={faArrowUp} /></button>
                            <button type="button" className="builder-icon-btn" onClick={() => deplacerModule(moduleIndex, 1)} disabled={moduleIndex === formulaire.modules.length - 1} aria-label="Descendre"><FontAwesomeIcon icon={faArrowDown} /></button>
                            <button type="button" className="builder-icon-btn" onClick={() => dupliquerModule(moduleIndex)} aria-label="Dupliquer"><FontAwesomeIcon icon={faCopy} /></button>
                            {formulaire.modules.length > 3 && <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerModule(moduleIndex)} aria-label="Supprimer"><FontAwesomeIcon icon={faTrash} /></button>}
                          </div>
                        </div>
                        {module.ouvert && (
                          <>
                            <div className="form-grid">
                              <label>Titre du module<input value={module.titre} onChange={(event) => changerModule(moduleIndex, "titre", event.target.value)} /></label>
                              <label>Durée estimée<input type="number" min="1" value={module.duration} onChange={(event) => changerModule(moduleIndex, "duration", event.target.value)} /></label>
                              <label className="form-field-wide">Courte description<textarea value={module.description} onChange={(event) => changerModule(moduleIndex, "description", event.target.value)} /></label>
                            </div>
                            <div className="builder-lessons">
                              <div className="builder-inline-head"><h4>Leçons</h4><button type="button" className="btn-secondary btn-compact" onClick={() => ajouterLecon(moduleIndex)}><FontAwesomeIcon icon={faPlus} /> Ajouter une leçon</button></div>
                              {module.lessons.map((lecon, leconIndex) => (
                                <div className="builder-lesson-card" key={`lesson-${moduleIndex}-${leconIndex}`}>
                                  <div className="builder-inline-head"><strong>Leçon {leconIndex + 1}</strong><div className="builder-module-actions"><button type="button" className="builder-icon-btn" onClick={() => deplacerLecon(moduleIndex, leconIndex, -1)} disabled={leconIndex === 0}><FontAwesomeIcon icon={faArrowUp} /></button><button type="button" className="builder-icon-btn" onClick={() => deplacerLecon(moduleIndex, leconIndex, 1)} disabled={leconIndex === module.lessons.length - 1}><FontAwesomeIcon icon={faArrowDown} /></button>{module.lessons.length > 1 && <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerLecon(moduleIndex, leconIndex)}><FontAwesomeIcon icon={faTrash} /></button>}</div></div>
                                  <div className="form-grid">
                                    <label>Titre<input value={lecon.titre} onChange={(event) => changerLecon(moduleIndex, leconIndex, "titre", event.target.value)} /></label>
                                    <label>Type<select value={lecon.type} onChange={(event) => changerLecon(moduleIndex, leconIndex, "type", event.target.value)}>{TYPES_LECONS.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                                    <label>Durée estimée<input type="number" min="1" value={lecon.duration} onChange={(event) => changerLecon(moduleIndex, leconIndex, "duration", event.target.value)} /></label>
                                    <label className="form-field-wide">Description facultative<textarea value={lecon.description} onChange={(event) => changerLecon(moduleIndex, leconIndex, "description", event.target.value)} /></label>
                                    <label className="form-field-wide">Contenu<textarea value={lecon.contenu} onChange={(event) => changerLecon(moduleIndex, leconIndex, "contenu", event.target.value)} placeholder="Texte, lien, résumé, ou contenu principal." /></label>
                                    {lecon.type === "Vidéo" && <label className="form-field-wide">URL vidéo<input value={lecon.videoUrl} onChange={(event) => changerLecon(moduleIndex, leconIndex, "videoUrl", event.target.value)} /></label>}
                                    {lecon.type === "Document PDF" && <label className="form-field-wide">URL du PDF<input value={lecon.pdfUrl} onChange={(event) => changerLecon(moduleIndex, leconIndex, "pdfUrl", event.target.value)} /></label>}
                                  </div>
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
                  <div className="builder-inline-head"><div><h3>Quiz de fin de formation</h3><p className="builder-muted">Ajoutez 2 ou 3 quiz. Ils apparaîtront uniquement après toutes les leçons.</p></div><button type="button" className="btn-create btn-compact" onClick={ajouterQuiz} disabled={formulaire.quizzes.length >= 3}><FontAwesomeIcon icon={faPlus} /> Ajouter un quiz</button></div>
                  {formulaire.quizzes.map((quiz, quizIndex) => (
                    <article className="builder-quiz-card" key={`quiz-${quizIndex}`}>
                      <div className="builder-inline-head"><h4>Quiz final {quizIndex + 1}</h4>{formulaire.quizzes.length > 2 && <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerQuiz(quizIndex)}><FontAwesomeIcon icon={faTrash} /></button>}</div>
                      <div className="form-grid">
                        <label>Titre<input value={quiz.titre} onChange={(event) => changerQuiz(quizIndex, "titre", event.target.value)} /></label>
                        <label>Score minimum (%)<input type="number" min="0" max="100" value={quiz.scoreMinimum} onChange={(event) => changerQuiz(quizIndex, "scoreMinimum", event.target.value)} /></label>
                        <label>Tentatives autorisées<input type="number" min="1" value={quiz.tentatives} onChange={(event) => changerQuiz(quizIndex, "tentatives", event.target.value)} /></label>
                        <label className="form-field-wide">Courte description<textarea value={quiz.description} onChange={(event) => changerQuiz(quizIndex, "description", event.target.value)} /></label>
                      </div>
                      {quiz.questions.map((question, questionIndex) => (
                        <div className="builder-question-card" key={`question-${quizIndex}-${questionIndex}`}>
                          <div className="builder-inline-head"><strong>Question {questionIndex + 1}</strong>{quiz.questions.length > 1 && <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerQuestion(quizIndex, questionIndex)}><FontAwesomeIcon icon={faTrash} /></button>}</div>
                          <div className="form-grid">
                            <label className="form-field-wide">Énoncé<input value={question.enonce} onChange={(event) => changerQuestion(quizIndex, questionIndex, "enonce", event.target.value)} /></label>
                            <label>Type<select value={question.type} onChange={(event) => changerQuestion(quizIndex, questionIndex, "type", event.target.value)}>{TYPES_QUESTIONS.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                            <label>Points<input type="number" min="1" value={question.points} onChange={(event) => changerQuestion(quizIndex, questionIndex, "points", event.target.value)} /></label>
                          </div>
                          <div className="builder-answers">
                            {question.reponses.map((reponse, reponseIndex) => (
                              <label className="builder-answer-row" key={`answer-${quizIndex}-${questionIndex}-${reponseIndex}`}>
                                <input type="checkbox" checked={reponse.correcte} onChange={(event) => changerReponse(quizIndex, questionIndex, reponseIndex, "correcte", event.target.checked)} />
                                <input value={reponse.texte} onChange={(event) => changerReponse(quizIndex, questionIndex, reponseIndex, "texte", event.target.value)} placeholder={`Réponse ${reponseIndex + 1}`} />
                                {question.reponses.length > 2 && <button type="button" className="builder-icon-btn builder-icon-btn--danger" onClick={() => supprimerReponse(quizIndex, questionIndex, reponseIndex)}><FontAwesomeIcon icon={faTrash} /></button>}
                              </label>
                            ))}
                            <button type="button" className="btn-secondary btn-compact" onClick={() => ajouterReponse(quizIndex, questionIndex)}>Ajouter une réponse</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn-secondary btn-compact" onClick={() => ajouterQuestion(quizIndex)}><FontAwesomeIcon icon={faPlus} /> Ajouter une question</button>
                    </article>
                  ))}
                </section>
              )}

              {etape === 3 && (
                <section className="form-section builder-step-panel">
                  <h3>Aperçu et publication</h3>
                  <div className="builder-preview-grid">
                    <article className="builder-preview-card">
                      {formulaire.image_url ? <img src={formulaire.image_url} alt="" /> : <div className="builder-preview-empty"><FontAwesomeIcon icon={faImage} /></div>}
                      <div><h4>{formulaire.titre || "Titre de la formation"}</h4><p>{formulaire.descriptionCourte || "Description courte de la formation."}</p><div className="builder-preview-meta"><span><FontAwesomeIcon icon={faLayerGroup} /> {formulaire.modules.length} modules</span><span><FontAwesomeIcon icon={faBookOpen} /> {totalLecons} leçons</span><span><FontAwesomeIcon icon={faQuestionCircle} /> {formulaire.quizzes.length} quiz · {totalQuestions} questions</span></div></div>
                    </article>
                    <aside className="builder-checklist"><h4>Checklist avant publication</h4>{checklist.map((item) => <button type="button" key={item.label} className={item.ok ? "is-ok" : "is-missing"}><FontAwesomeIcon icon={item.ok ? faCheck : faTriangleExclamation} />{item.label}</button>)}</aside>
                  </div>
                </section>
              )}

              <div className="builder-actions-bar">
                <Link to="/dashboard/formateur" className="btn-secondary"><FontAwesomeIcon icon={faXmark} /> Annuler</Link>
                <button type="button" className="btn-secondary" onClick={() => enregistrer("Brouillon")} disabled={chargement}><FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer comme brouillon</button>
                <button type="button" className="btn-secondary" onClick={() => setEtape((actuel) => Math.max(actuel - 1, 0))} disabled={etape === 0}><FontAwesomeIcon icon={faArrowLeft} /> Retour</button>
                {etape < ETAPES.length - 1 ? <button type="button" className="btn-create" onClick={() => setEtape((actuel) => actuel + 1)}>Continuer <FontAwesomeIcon icon={faArrowRight} /></button> : <button type="button" className="btn-create" onClick={() => enregistrer("Publié")} disabled={chargement}><FontAwesomeIcon icon={faRocket} /> {chargement ? "Publication..." : "Publier"}</button>}
              </div>
            </form>
          </div>
        </section>
      </main>

      {succes && (
        <div className="builder-success-overlay" role="dialog" aria-modal="true" aria-labelledby="publish-success-title">
          <div className="builder-success-modal">
            <div className="builder-success-icon"><FontAwesomeIcon icon={faCheck} /></div>
            <h3 id="publish-success-title">Formation publiée avec succès.</h3>
            <p>{succes.titre || formulaire.titre}</p>
            <div className="modal-actions">
              <button type="button" className="btn-create" onClick={() => navigate(`/formation/${succes.id}`)}>Voir la formation</button>
              <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard/formateur")}>Retour au dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreerAtelier;
