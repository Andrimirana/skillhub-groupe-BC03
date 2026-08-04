import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import PublicNavbar from "../components/PublicNavbar";
import {
  CourseCompletedModal,
  CourseHeader,
  CourseSidebar,
  FinalQuizzesSection,
  LessonContent,
  LessonNavigation,
  ModuleCompletedModal,
} from "../components/learning/LearningPageComponents";
import {
  detailFormation,
  inscrireFormation,
  listerFormationsApprenant,
  mettreAJourProgressionFormation,
} from "../services/formationsApi";
import "../styles/suiviFormation.css";

function lireJson(valeur) {
  if (!valeur || typeof valeur !== "string") return null;
  try {
    return JSON.parse(valeur);
  } catch {
    return null;
  }
}

function normaliserFormation(formation) {
  const finalQuizzes = [];
  const modules = (formation.modules || []).map((module, moduleIndex) => {
    const contenu = lireJson(module.contenu) || {};
    if (Array.isArray(contenu.finalQuizzes)) {
      finalQuizzes.push(...contenu.finalQuizzes);
    }
    const lessonsSource = Array.isArray(contenu.lessons) && contenu.lessons.length > 0
      ? contenu.lessons
      : [{
        titre: module.titre,
        type: "Texte",
        duration: contenu.duration || 10,
        contenu: module.contenu || contenu.description || "",
      }];

    const normalizedModule = {
      key: String(module.id || module.titre || moduleIndex),
      id: module.id,
      titre: module.titre || `Module ${moduleIndex + 1}`,
      duration: Number(contenu.duration || 0),
      lessons: [],
    };

    normalizedModule.lessons = lessonsSource.map((lesson, lessonIndex) => ({
      ...lesson,
      key: `${normalizedModule.key}:lesson:${lessonIndex}`,
      moduleKey: normalizedModule.key,
      moduleIndex,
      lessonIndex,
      titre: lesson.titre || `Leçon ${lessonIndex + 1}`,
      type: lesson.type || "Texte",
      duration: Number(lesson.duration || 5),
      contenu: lesson.contenu || lesson.description || "",
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      pdfUrl: lesson.pdfUrl || lesson.url || "",
    }));

    return normalizedModule;
  });

  return { ...formation, modules, finalQuizzes };
}

function trouverDerniereLeconNonTerminee(lessons, completed, isLocked) {
  return lessons.find((lesson) => !completed[lesson.key] && !isLocked(lesson)) || lessons[0] || null;
}

function SuiviFormation() {
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [activeKey, setActiveKey] = useState("");
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moduleDone, setModuleDone] = useState(null);
  const [courseDone, setCourseDone] = useState(false);
  const [quizDone, setQuizDone] = useState({});

  const flatLessons = useMemo(
    () => (formation?.modules || []).flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, module }))),
    [formation],
  );
  const activeLesson = flatLessons.find((lesson) => lesson.key === activeKey) || flatLessons[0] || null;
  const completedCount = flatLessons.filter((lesson) => completed[lesson.key]).length;
  const progression = flatLessons.length ? Math.round((completedCount / flatLessons.length) * 100) : 0;
  const allLessonsCompleted = flatLessons.length > 0 && completedCount === flatLessons.length;

  const isLocked = (lesson) => {
    if (!lesson) return true;
    if (lesson.moduleIndex === 0 && lesson.lessonIndex === 0) return false;
    const previous = flatLessons[flatLessons.findIndex((item) => item.key === lesson.key) - 1];
    return previous ? !completed[previous.key] : false;
  };

  const persist = async (nextCompleted = completed, nextKey = activeKey) => {
    const nextCompletedKeys = Object.keys(nextCompleted).filter((key) => nextCompleted[key]);
    setSaving(true);
    try {
      await mettreAJourProgressionFormation(id, {
        completed_modules: nextCompletedKeys,
        last_lesson_key: nextKey,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectLesson = (key) => {
    const lesson = flatLessons.find((item) => item.key === key);
    if (!lesson || isLocked(lesson)) return;
    setActiveKey(key);
    setDrawerOpen(false);
    persist(completed, key).catch(() => {});
  };

  const completeLesson = () => {
    if (!activeLesson) return;
    const nextCompleted = { ...completed, [activeLesson.key]: true };
    setCompleted(nextCompleted);

    const module = formation.modules[activeLesson.moduleIndex];
    const moduleCompleted = module.lessons.every((lesson) => nextCompleted[lesson.key]);
    const allCompleted = flatLessons.every((lesson) => nextCompleted[lesson.key]);
    const nextLesson = flatLessons[flatLessons.findIndex((lesson) => lesson.key === activeLesson.key) + 1];

    persist(nextCompleted, nextLesson?.key || activeLesson.key).catch(() => {});

    if (allCompleted && (formation.finalQuizzes || []).length === 0) {
      setCourseDone(true);
    } else if (moduleCompleted) {
      setModuleDone(module);
    }

    if (nextLesson) {
      setActiveKey(nextLesson.key);
    }
  };

  const goTo = (direction) => {
    const index = flatLessons.findIndex((lesson) => lesson.key === activeLesson?.key);
    const target = flatLessons[index + direction];
    if (target) selectLesson(target.key);
  };

  const resume = () => {
    const lesson = trouverDerniereLeconNonTerminee(flatLessons, completed, isLocked);
    if (lesson) selectLesson(lesson.key);
  };

  const terminerQuiz = (quizIndex) => {
    const prochainsQuiz = { ...quizDone, [quizIndex]: true };
    setQuizDone(prochainsQuiz);
    if ((formation.finalQuizzes || []).every((_, index) => prochainsQuiz[index])) {
      setCourseDone(true);
    }
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const enrolled = await listerFormationsApprenant();
        let target = enrolled.find((item) => String(item.id) === String(id));
        let enrollment = null;

        if (!target) {
          enrollment = await inscrireFormation(id);
          const detail = await detailFormation(id);
          target = {
            ...detail,
            progression: enrollment.progression ?? 0,
            completed_modules: enrollment.completed_modules ?? [],
            last_lesson_key: enrollment.last_lesson_key,
          };
        }

        if (!alive) return;

        const normalized = normaliserFormation(target);
        const nextCompleted = {};
        (target.completed_modules || []).forEach((key) => {
          nextCompleted[String(key)] = true;
        });

        setFormation(normalized);
        setCompleted(nextCompleted);

        const lessons = normalized.modules.flatMap((module) => module.lessons);
        const lastKey = target.last_lesson_key && lessons.some((lesson) => lesson.key === target.last_lesson_key)
          ? target.last_lesson_key
          : trouverDerniereLeconNonTerminee(lessons, nextCompleted, () => false)?.key;
        setActiveKey(lastKey || lessons[0]?.key || "");
      } catch {
        setError("Impossible de charger cette formation. Vérifiez que vous êtes connecté comme apprenant.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="learn-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Chargement de la formation...</span>
      </main>
    );
  }

  if (error || !formation) {
    return (
      <main className="learn-error">
        <p>{error || "Formation introuvable."}</p>
        <Link to="/formations">Retour aux formations</Link>
      </main>
    );
  }

  const previousLesson = flatLessons[flatLessons.findIndex((lesson) => lesson.key === activeLesson?.key) - 1];
  const nextLesson = flatLessons[flatLessons.findIndex((lesson) => lesson.key === activeLesson?.key) + 1];

  return (
    <main className="learn-page">
      <PublicNavbar
        menuItems={[
          { label: "Accueil", to: "/" },
          { label: "Formations", to: "/formations" },
          { label: "Dashboard", to: "/dashboard/apprenant" },
        ]}
      />

      <CourseHeader
        formation={formation}
        completedCount={completedCount}
        totalLessons={flatLessons.length}
        progression={progression}
        onResume={resume}
        onToggleSidebar={() => setDrawerOpen(true)}
      />

      <div className="learn-shell">
        <CourseSidebar
          modules={formation.modules}
          activeKey={activeLesson?.key}
          completed={completed}
          isLocked={isLocked}
          onSelect={selectLesson}
          collapsed={sidebarCollapsed}
          drawerOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <section className="learn-main">
          <button type="button" className="learn-collapse-btn" onClick={() => setSidebarCollapsed((value) => !value)}>
            {sidebarCollapsed ? "Afficher le programme" : "Réduire le programme"}
          </button>
          {saving && <p className="learn-saving">Sauvegarde...</p>}

          {activeLesson ? (
            <>
              <LessonContent
                module={activeLesson.module}
                lesson={activeLesson}
                progression={progression}
                completedCount={completedCount}
                totalLessons={flatLessons.length}
                onComplete={completeLesson}
              />
              <LessonNavigation
                previous={previousLesson}
                next={nextLesson && !isLocked(nextLesson) ? nextLesson : null}
                onPrevious={() => goTo(-1)}
                onNext={() => goTo(1)}
                onComplete={completeLesson}
                isCompleted={Boolean(completed[activeLesson.key])}
              />
              {allLessonsCompleted && (
                <FinalQuizzesSection
                  quizzes={formation.finalQuizzes || []}
                  completed={quizDone}
                  onQuizSuccess={terminerQuiz}
                />
              )}
            </>
          ) : (
            <article className="learn-content-card">
              <h2>Aucune leçon disponible</h2>
            </article>
          )}
        </section>
      </div>

      <ModuleCompletedModal
        module={moduleDone}
        onClose={() => setModuleDone(null)}
        onContinue={() => {
          setModuleDone(null);
          if (nextLesson) selectLesson(nextLesson.key);
        }}
      />

      {courseDone && (
        <CourseCompletedModal
          formation={formation}
          modulesCount={formation.modules.length}
          lessonsCount={flatLessons.length}
          onClose={() => setCourseDone(false)}
        />
      )}
    </main>
  );
}

export default SuiviFormation;
