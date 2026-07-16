import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBookOpen,
  faCheck,
  faChevronDown,
  faCircle,
  faFile,
  faFileLines,
  faLock,
  faPlay,
  faQuestionCircle,
  faRotateRight,
  faTrophy,
  faVideo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export function ProgressBar({ value }) {
  return <div className="learn-progress"><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
};

export function CourseHeader({ formation, completedCount, totalLessons, progression, onResume, onToggleSidebar }) {
  return (
    <header className="learn-header">
      <button type="button" className="learn-sidebar-toggle" onClick={onToggleSidebar}>
        <FontAwesomeIcon icon={faBars} /> Programme
      </button>
      <div>
        <span className="learn-kicker">Apprendre la formation</span>
        <h1>{formation.titre}</h1>
        <p>{completedCount} leçon{completedCount > 1 ? "s" : ""} terminée{completedCount > 1 ? "s" : ""} sur {totalLessons} — {progression}%</p>
      </div>
      <div className="learn-header-card">
        <strong>{progression}%</strong>
        <ProgressBar value={progression} />
        <button type="button" onClick={onResume}>
          <FontAwesomeIcon icon={faPlay} /> Reprendre la formation
        </button>
      </div>
    </header>
  );
}

CourseHeader.propTypes = {
  formation: PropTypes.object.isRequired,
  completedCount: PropTypes.number.isRequired,
  totalLessons: PropTypes.number.isRequired,
  progression: PropTypes.number.isRequired,
  onResume: PropTypes.func.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
};

const TYPE_ICON = {
  vidéo: faVideo,
  video: faVideo,
  texte: faFileLines,
  document: faFile,
  pdf: faFile,
  quiz: faQuestionCircle,
  exercice: faBookOpen,
  "exercice pratique": faBookOpen,
};

function lessonIcon(type) {
  return TYPE_ICON[String(type || "texte").toLowerCase()] || faFileLines;
}

function moduleStatus(done, total, locked) {
  if (locked) return "Verrouillé";
  if (done === 0) return "Non commencé";
  if (done >= total) return "Terminé";
  return "En cours";
}

export function CourseSidebar({ modules, activeKey, completed, isLocked, onSelect, collapsed, drawerOpen, onClose }) {
  return (
    <aside className={`learn-sidebar ${collapsed ? "is-collapsed" : ""} ${drawerOpen ? "is-open" : ""}`}>
      <div className="learn-sidebar-head">
        <div>
          <strong>Programme</strong>
          <span>{modules.length} module{modules.length > 1 ? "s" : ""}</span>
        </div>
        <button type="button" onClick={onClose} className="learn-sidebar-close" aria-label="Fermer">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {modules.map((module, moduleIndex) => {
        const total = module.lessons.length;
        const done = module.lessons.filter((lesson) => completed[lesson.key]).length;
        const locked = isLocked(module.lessons[0]);
        const progress = total ? Math.round((done / total) * 100) : 0;

        return (
          <details className="learn-module" key={module.key} open>
            <summary>
              <span className="learn-module-number">{locked ? <FontAwesomeIcon icon={faLock} /> : moduleIndex + 1}</span>
              <div>
                <strong>{module.titre}</strong>
                <small>{total} leçon{total > 1 ? "s" : ""} · {moduleStatus(done, total, locked)}</small>
                <ProgressBar value={progress} />
              </div>
              <FontAwesomeIcon icon={faChevronDown} />
            </summary>

            <ol className="learn-lessons">
              {module.lessons.map((lesson, lessonIndex) => {
                const lessonLocked = isLocked(lesson);
                const selected = activeKey === lesson.key;
                const doneLesson = Boolean(completed[lesson.key]);

                return (
                  <li key={lesson.key}>
                    <button
                      type="button"
                      className={`learn-lesson ${selected ? "is-active" : ""} ${doneLesson ? "is-done" : ""}`}
                      disabled={lessonLocked}
                      title={lessonLocked ? "Terminez la leçon précédente pour débloquer celle-ci." : lesson.titre}
                      onClick={() => onSelect(lesson.key)}
                    >
                      <span>{lessonLocked ? <FontAwesomeIcon icon={faLock} /> : doneLesson ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faCircle} />}</span>
                      <FontAwesomeIcon icon={lessonIcon(lesson.type)} />
                      <div>
                        <strong>{lessonIndex + 1}. {lesson.titre}</strong>
                        <small>{lesson.type} · {lesson.duration || 5} min</small>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </aside>
  );
}

CourseSidebar.propTypes = {
  modules: PropTypes.array.isRequired,
  activeKey: PropTypes.string,
  completed: PropTypes.object.isRequired,
  isLocked: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  collapsed: PropTypes.bool.isRequired,
  drawerOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export function TextLesson({ lesson }) {
  return (
    <div className="learn-readable">
      {(lesson.contenu || lesson.description || "Contenu à venir.")
        .split("\n")
        .filter(Boolean)
        .map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  );
}

TextLesson.propTypes = {
  lesson: PropTypes.object.isRequired,
};

export function VideoLesson({ lesson, videoProgress, onVideoProgress }) {
  return (
    <div className="learn-video">
      <div className="learn-video-player">
        {lesson.videoUrl ? (
          <iframe src={lesson.videoUrl} title={lesson.titre} allowFullScreen />
        ) : (
          <div><FontAwesomeIcon icon={faPlay} /><span>Vidéo de la leçon</span></div>
        )}
      </div>
      <label>
        Progression de lecture : {videoProgress}%
        <input type="range" min="0" max="100" value={videoProgress} onChange={(event) => onVideoProgress(Number(event.target.value))} />
      </label>
    </div>
  );
}

VideoLesson.propTypes = {
  lesson: PropTypes.object.isRequired,
  videoProgress: PropTypes.number.isRequired,
  onVideoProgress: PropTypes.func.isRequired,
};

export function DocumentLesson({ lesson }) {
  const url = lesson.url || lesson.videoUrl || "#";

  return (
    <div className="learn-document">
      <FontAwesomeIcon icon={faFile} />
      <h3>{lesson.titre}</h3>
      <p>{lesson.description || lesson.contenu || "Document de cours à consulter."}</p>
      <div>
        <a href={url} target="_blank" rel="noreferrer">Ouvrir</a>
        <a href={url} target="_blank" rel="noreferrer" download>Télécharger</a>
      </div>
    </div>
  );
}

DocumentLesson.propTypes = {
  lesson: PropTypes.object.isRequired,
};

export function QuizLesson({ quiz, onSuccess }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState(null);
  const questions = quiz?.questions || [];
  const maxAttempts = Number(quiz?.tentatives || 2);

  const submit = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      const selected = answers[index] || [];
      const expected = question.reponses.map((rep, i) => (rep.correcte ? i : null)).filter((item) => item !== null);
      if (selected.length === expected.length && selected.every((item) => expected.includes(item))) correct += 1;
    });
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const success = score >= Number(quiz.scoreMinimum || 70);
    setAttempts((value) => value + 1);
    setResult({ score, correct, success });
    if (success) onSuccess();
  };

  if (!quiz || questions.length === 0) return <TextLesson lesson={{ contenu: "Quiz en préparation." }} />;

  if (result) {
    return (
      <div className={`learn-quiz-result ${result.success ? "is-success" : "is-failed"}`}>
        <FontAwesomeIcon icon={result.success ? faTrophy : faRotateRight} />
        <h3>{result.success ? "Quiz réussi" : "Quiz à revoir"}</h3>
        <p>Score obtenu : {result.score}% · Score minimum : {quiz.scoreMinimum || 70}% · {result.correct}/{questions.length} bonnes réponses</p>
        {!result.success && attempts < maxAttempts && (
          <button type="button" onClick={() => { setResult(null); setStarted(true); setCurrent(0); setAnswers({}); }}>
            Recommencer
          </button>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="learn-quiz-intro">
        <h3>{quiz.titre || "Quiz"}</h3>
        <p>{quiz.instructions || "Répondez aux questions pour valider la leçon."}</p>
        <div className="learn-quiz-meta">
          <span>{questions.length} question{questions.length > 1 ? "s" : ""}</span>
          <span>Score minimum {quiz.scoreMinimum || 70}%</span>
          <span>{maxAttempts} tentative{maxAttempts > 1 ? "s" : ""}</span>
        </div>
        <button type="button" onClick={() => setStarted(true)}>Commencer le quiz</button>
      </div>
    );
  }

  const question = questions[current];
  const isMultiple = question.type === "Choix multiples";

  return (
    <div className="learn-quiz">
      <div className="learn-quiz-top">
        <span>Question {current + 1}/{questions.length}</span>
        <ProgressBar value={Math.round(((current + 1) / questions.length) * 100)} />
      </div>
      <h3>{question.enonce}</h3>
      <div className="learn-answers">
        {question.reponses.map((answer, index) => {
          const selected = (answers[current] || []).includes(index);
          return (
            <label key={`${answer.texte}-${index}`} className={selected ? "is-selected" : ""}>
              <input
                type={isMultiple ? "checkbox" : "radio"}
                checked={selected}
                onChange={(event) => {
                  setAnswers((previous) => ({
                    ...previous,
                    [current]: isMultiple
                      ? event.target.checked
                        ? [...(previous[current] || []), index]
                        : (previous[current] || []).filter((item) => item !== index)
                      : [index],
                  }));
                }}
              />
              {answer.texte}
            </label>
          );
        })}
      </div>
      <div className="learn-actions">
        <button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>Précédent</button>
        {current < questions.length - 1 ? (
          <button type="button" onClick={() => setCurrent((value) => value + 1)}>Suivant</button>
        ) : (
          <button type="button" onClick={submit}>Terminer</button>
        )}
      </div>
    </div>
  );
}

QuizLesson.propTypes = {
  quiz: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

export function LessonContent({ formation, module, lesson, progression, completedCount, totalLessons, videoProgress, onVideoProgress, onComplete }) {
  const quiz = useMemo(() => {
    if (String(lesson.type).toLowerCase().includes("quiz")) return lesson.quiz || module.quizzes?.[0];
    return null;
  }, [lesson, module]);

  const type = String(lesson.type || "Texte").toLowerCase();

  return (
    <article className="learn-content-card">
      <div className="learn-content-top">
        <div>
          <span className="learn-kicker">{formation.titre}</span>
          <h2>{lesson.titre}</h2>
          <p>{module.titre} · {lesson.type} · {lesson.duration || 5} min</p>
        </div>
        <div className="learn-score">
          <strong>{progression}%</strong>
          <span>{completedCount}/{totalLessons} leçons</span>
        </div>
      </div>
      <ProgressBar value={progression} />

      {type.includes("vid") && <VideoLesson lesson={lesson} videoProgress={videoProgress} onVideoProgress={onVideoProgress} />}
      {(type.includes("texte") || type.includes("exercice") || type.includes("projet")) && <TextLesson lesson={lesson} />}
      {(type.includes("document") || type.includes("pdf")) && <DocumentLesson lesson={lesson} />}
      {type.includes("quiz") && <QuizLesson quiz={quiz} onSuccess={onComplete} />}

      {!type.includes("quiz") && (
        <button type="button" className="learn-complete-btn" onClick={onComplete}>
          <FontAwesomeIcon icon={faCheck} /> Marquer comme terminée
        </button>
      )}
    </article>
  );
}

LessonContent.propTypes = {
  formation: PropTypes.object.isRequired,
  module: PropTypes.object.isRequired,
  lesson: PropTypes.object.isRequired,
  progression: PropTypes.number.isRequired,
  completedCount: PropTypes.number.isRequired,
  totalLessons: PropTypes.number.isRequired,
  videoProgress: PropTypes.number.isRequired,
  onVideoProgress: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export function LessonNavigation({ previous, next, onPrevious, onNext, onComplete, isCompleted }) {
  return (
    <nav className="learn-navigation" aria-label="Navigation leçon">
      <button type="button" disabled={!previous} onClick={onPrevious}>Leçon précédente</button>
      <button type="button" className="is-primary" disabled={isCompleted} onClick={onComplete}>
        {isCompleted ? "Leçon terminée" : "Marquer comme terminée"}
      </button>
      <button type="button" disabled={!next} onClick={onNext}>Leçon suivante</button>
    </nav>
  );
}

LessonNavigation.propTypes = {
  previous: PropTypes.object,
  next: PropTypes.object,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  isCompleted: PropTypes.bool.isRequired,
};

export function ModuleCompletedModal({ module, onContinue, onClose }) {
  if (!module) return null;
  return (
    <div className="learn-modal-backdrop">
      <section className="learn-modal">
        <button type="button" className="learn-modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        <FontAwesomeIcon icon={faTrophy} />
        <h2>Module terminé !</h2>
        <p>{module.titre}</p>
        <strong>Progression à 100 %</strong>
        <button type="button" onClick={onContinue}>Continuer vers le module suivant</button>
      </section>
    </div>
  );
}

ModuleCompletedModal.propTypes = {
  module: PropTypes.object,
  onContinue: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export function CourseCompletedModal({ formation, modulesCount, lessonsCount, onClose }) {
  return (
    <div className="learn-modal-backdrop">
      <section className="learn-modal">
        <button type="button" className="learn-modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        <FontAwesomeIcon icon={faTrophy} />
        <h2>Félicitations, vous avez terminé la formation !</h2>
        <p>{formation.titre}</p>
        <strong>Progression à 100 % · {modulesCount} modules · {lessonsCount} leçons terminées</strong>
        <div className="learn-modal-actions">
          <button type="button" onClick={onClose}>Revoir la formation</button>
          <Link to="/dashboard/apprenant">Retour au dashboard</Link>
          <Link to="/formations">Découvrir d’autres formations</Link>
        </div>
      </section>
    </div>
  );
}

CourseCompletedModal.propTypes = {
  formation: PropTypes.object.isRequired,
  modulesCount: PropTypes.number.isRequired,
  lessonsCount: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};
