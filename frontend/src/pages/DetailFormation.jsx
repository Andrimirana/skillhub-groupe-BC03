import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faClock,
  faEye,
  faFolderOpen,
  faLayerGroup,
  faUserGraduate,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  detailFormation,
  inscrireFormation,
  listerFormations,
  listerFormationsApprenant,
} from "../services/formationsApi";
import { estConnecte, recupererUtilisateur } from "../services/auth";
import PublicNavbar from "../components/PublicNavbar";
import AuthModal from "../components/AuthModal";
import EmptyState from "../components/EmptyState";
import SkeletonGrid from "../components/SkeletonGrid";
import "../styles/public.css";

const IMAGES_COURS = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
];

function libelleHeures(nombreHeures) {
  const heures = Number(nombreHeures || 0);
  return `${heures || 1} heure${heures > 1 ? "s" : ""}`;
}

function DetailFormation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [inscriptionEnCours, setInscriptionEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [estInscrit, setEstInscrit] = useState(false);
  const [recommandations, setRecommandations] = useState([]);
  const [onglet, setOnglet] = useState("modules");
  const [moduleOuvert, setModuleOuvert] = useState(null);
  const [authModal, setAuthModal] = useState(null);

  const utilisateur = recupererUtilisateur();
  const peutSInscrire = !utilisateur || utilisateur.role === "apprenant";

  useEffect(() => {
    let actif = true;

    const charger = async () => {
      try {
        setChargement(true);
        const donnees = await detailFormation(id);
        if (!actif) return;
        setFormation(donnees);

        try {
          const catalogue = await listerFormations();
          if (!actif) return;
          const similaires = (catalogue || [])
            .filter((item) => String(item.id) !== String(id))
            .sort((a, b) => {
              const categorieA = a.category && donnees.category && a.category === donnees.category ? 0 : 1;
              const categorieB = b.category && donnees.category && b.category === donnees.category ? 0 : 1;
              return categorieA - categorieB;
            })
            .slice(0, 3);
          setRecommandations(similaires);
        } catch {
          setRecommandations([]);
        }

        if (estConnecte() && peutSInscrire) {
          try {
            const mesFormations = await listerFormationsApprenant();
            if (!actif) return;
            const dejaInscrit = (mesFormations || []).some(
              (item) => String(item.id) === String(id),
            );
            setEstInscrit(dejaInscrit);
          } catch {
            // L'utilisateur pourra tenter l'inscription normalement.
          }
        }
      } finally {
        if (actif) setChargement(false);
      }
    };

    charger();

    return () => {
      actif = false;
    };
  }, [id, peutSInscrire]);

  const gererSuivre = async () => {
    if (!estConnecte()) {
      setAuthModal("connexion");
      return;
    }

    try {
      setInscriptionEnCours(true);
      await inscrireFormation(id);
      setMessage("Inscription réussie. Redirection vers le suivi...");
      setEstInscrit(true);
      setTimeout(() => navigate(`/apprendre/${id}`), 500);
    } catch (e) {
      const texte = e.response?.data?.message || "Impossible de suivre cette formation.";
      setMessage(texte);
    } finally {
      setInscriptionEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="dp-page">
        <PublicNavbar
          menuItems={[
            { label: "Accueil", to: "/" },
            { label: "Formations", to: "/formations" },
            { label: "À propos", href: "#" },
            { label: "Contact", href: "#footer" },
          ]}
        />
        <main className="dp-body">
          <div className="dp-body-inner">
            <SkeletonGrid count={4} />
          </div>
        </main>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="public-page">
        <PublicNavbar
          menuItems={[
            { label: "Accueil", to: "/" },
            { label: "Formations", to: "/formations" },
            { label: "À propos", href: "#" },
            { label: "Contact", href: "#footer" },
          ]}
        />
        <main className="dp-body">
          <div className="dp-body-inner">
            <EmptyState
              icon={faFolderOpen}
              title="Formation introuvable"
              description="Cette formation n’existe pas ou n’est plus disponible."
              action={<Link to="/formations" className="btn-create">Retour aux formations</Link>}
            />
          </div>
        </main>
      </div>
    );
  }

  const modules = formation.modules || [];
  const imagePrincipale = formation.image_url || formation.imageUrl || IMAGES_COURS[Number(id) % IMAGES_COURS.length];

  return (
    <div className="dp-page">
      <PublicNavbar
        menuItems={[
          { label: "Accueil", to: "/" },
          { label: "Formations", to: "/formations" },
          { label: "À propos", href: "#" },
          { label: "Contact", href: "#footer" },
        ]}
      />

      <div className="dp-hero">
        <div className="dp-hero-inner">
          <h1 className="dp-hero-title">{formation.titre}</h1>
          <p className="dp-hero-desc">
            {formation.description || "Un parcours clair, pratique et progressif pour développer vos compétences."}
          </p>
          <div className="dp-hero-meta">
            <span><FontAwesomeIcon icon={faUserGraduate} className="dp-icon" /> {formation.formateur || "SkillHub"}</span>
            <span><FontAwesomeIcon icon={faUsers} className="dp-icon" /> {formation.apprenants ?? 0} apprenants</span>
            <span><FontAwesomeIcon icon={faClock} className="dp-icon" /> {libelleHeures(formation.duration ?? formation.duree)}</span>
          </div>
        </div>
      </div>

      <div className="dp-body">
        <div className="dp-body-inner">
          <main className="dp-main">
            <div className="dp-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={onglet === "modules"}
                className={`dp-tab ${onglet === "modules" ? "active" : ""}`}
                onClick={() => setOnglet("modules")}
              >
                Modules du cours
              </button>
              <button
                role="tab"
                aria-selected={onglet === "description"}
                className={`dp-tab ${onglet === "description" ? "active" : ""}`}
                onClick={() => setOnglet("description")}
              >
                Description
              </button>
            </div>

            {onglet === "modules" && (
              <ol className="dp-modules" aria-label="Modules du cours">
                {modules.length === 0 && (
                  <p className="dp-empty">Aucun module disponible pour cette formation.</p>
                )}
                {modules.map((module, i) => (
                  <li key={module.id ?? module.titre} className="dp-module">
                    <button
                      className="dp-module-header"
                      onClick={() => setModuleOuvert(moduleOuvert === module.id ? null : module.id)}
                      aria-expanded={moduleOuvert === module.id}
                    >
                      <div className="dp-module-left">
                        <span className="dp-module-num">{i + 1}</span>
                        <strong className="dp-module-titre">{module.titre}</strong>
                      </div>
                      <FontAwesomeIcon
                        icon={moduleOuvert === module.id ? faChevronUp : faChevronDown}
                        className="dp-module-chevron"
                      />
                    </button>
                    {moduleOuvert === module.id && module.contenu && (
                      <div className="dp-module-body">{module.contenu}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {onglet === "description" && (
              <div className="dp-desc-panel">
                <p className="dp-desc-text">
                  {formation.description || "Aucune description disponible."}
                </p>
                <div className="dp-desc-meta">
                  {formation.category && (
                    <span><FontAwesomeIcon icon={faFolderOpen} className="dp-icon" /> {formation.category}</span>
                  )}
                  <span><FontAwesomeIcon icon={faEye} className="dp-icon" /> {formation.vues ?? 0} vues</span>
                </div>
              </div>
            )}
          </main>

          <aside className="dp-card">
            <img src={imagePrincipale} alt="" className="dp-card-img" />
            <div className="dp-card-body">
              <p className="dp-card-free">Gratuit</p>
              <div className="dp-card-stats">
                <div className="dp-card-stat">
                  <FontAwesomeIcon icon={faUsers} className="dp-icon dp-icon--green" />
                  <span><strong>{formation.apprenants ?? 0}</strong> apprenants</span>
                </div>
                <div className="dp-card-stat">
                  <FontAwesomeIcon icon={faClock} className="dp-icon dp-icon--green" />
                  <span><strong>{libelleHeures(formation.duration ?? formation.duree)}</strong> de cours</span>
                </div>
                <div className="dp-card-stat">
                  <FontAwesomeIcon icon={faLayerGroup} className="dp-icon dp-icon--green" />
                  <span><strong>{modules.length}</strong> module{modules.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              {message && <p className="dp-message">{message}</p>}
              {estInscrit ? (
                <Link to={`/apprendre/${id}`} className="dp-cta dp-cta--start">
                  Continuer
                </Link>
              ) : peutSInscrire ? (
                <button
                  type="button"
                  className="dp-cta dp-cta--start"
                  onClick={gererSuivre}
                  disabled={inscriptionEnCours}
                >
                  {inscriptionEnCours ? "Inscription..." : "Commencer"}
                </button>
              ) : null}
              <Link to="/formations" className="dp-cta dp-cta--back">
                Retour aux formations
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {recommandations.length > 0 && (
        <section className="dp-reco" aria-labelledby="dp-reco-title">
          <div className="dp-reco-inner">
            <h2 id="dp-reco-title" className="dp-reco-title">Formations similaires</h2>
            <div className="dp-reco-grid">
              {recommandations.map((item, index) => (
                <article className="dp-reco-card" key={item.id}>
                  <Link to={`/formation/${item.id}`} className="dp-reco-link">
                    <div className="dp-reco-cover">
                      <img src={item.image_url || item.imageUrl || IMAGES_COURS[(index + 1) % IMAGES_COURS.length]} alt="" className="dp-reco-img" />
                    </div>
                    <div className="dp-reco-body">
                      <h3 className="dp-reco-nom">{item.titre}</h3>
                      <div className="dp-reco-stats">
                        <span><FontAwesomeIcon icon={faClock} /> {libelleHeures(item.duration ?? item.duree)} de cours</span>
                        <span><FontAwesomeIcon icon={faUserGraduate} /> {item.apprenants ?? 0} apprenants</span>
                      </div>
                      <p className="dp-reco-author">Par {item.formateur || "Formateur SkillHub"}</p>
                    </div>
                  </Link>
                  <div className="dp-reco-footer">
                    <Link to={`/formation/${item.id}`} className="dp-reco-btn dp-reco-btn--info">Plus d'infos</Link>
                    <Link to={`/apprendre/${item.id}`} className="dp-reco-btn dp-reco-btn--start">Commencer</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      {authModal && (
        <AuthModal
          modeInitial={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={() => {
            setAuthModal(null);
            setTimeout(() => gererSuivre(), 0);
          }}
        />
      )}
    </div>
  );
}

export default DetailFormation;
