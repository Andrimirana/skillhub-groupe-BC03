import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboard, faBullhorn, faMagnifyingGlass, faGraduationCap, faChevronLeft, faChevronRight, faClock, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import { recupererUtilisateur } from "../services/auth";
import { listerFormations } from "../services/formationsApi";
import PublicNavbar from "../components/PublicNavbar";
import AuthModal from "../components/AuthModal";
import "../styles/accueil.css";

const TEMOIGNAGES = [
  {
    nom: "Nandrianina",
    role: "Apprenante depuis 1 mois",
    photo: "/assets/images/profile1.jfif",
    texte: "SkillHub m'a permis d'avancer rapidement. Les modules sont clairs et bien structurés.",
  },
  {
    nom: "Maholy",
    role: "Apprenante depuis 3 mois",
    photo: "/assets/images/profile1.jfif",
    texte: "J'ai adoré la progression module par module. Je me sens vraiment accompagnée.",
  },
  {
    nom: "Irene",
    role: "Formatrice certifiée",
    photo: "/assets/images/profile1.jfif",
    texte: "Les ateliers sont très bien structurés. Une expérience enrichissante pour mes élèves.",
  },
  {
    nom: "Mathieu",
    role: "Apprenant depuis 6 mois",
    photo: "/assets/images/profile1.jfif",
    texte: "Une plateforme claire et efficace. J'ai progressé plus vite que prévu.",
  },
];

const IMAGES_APPRENTISSAGE = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
];

function libelleHeures(nombreHeures) {
  const heures = Number(nombreHeures || 0);
  return `${heures || 1} heure${heures > 1 ? "s" : ""} de cours`;
}

// Page d'accueil principale du site
function Accueil() {
  const [parametresRecherche, setParametresRecherche] = useSearchParams();
  const [authModal, setAuthModal] = useState(() => {
    const modeAuth = new URLSearchParams(window.location.search).get("auth");
    return ["connexion", "inscription"].includes(modeAuth) ? modeAuth : null;
  });
  const [pointActif, setPointActif] = useState(0);
  const [formationActive, setFormationActive] = useState(0);
  const [directionTemoignages, setDirectionTemoignages] = useState("");
  const [directionFormations, setDirectionFormations] = useState("");
  const [formationsMisesEnAvant, setFormationsMisesEnAvant] = useState([]);
  const [erreurFormations, setErreurFormations] = useState(false);

  // Récupère l'utilisateur connecté et prépare les liens principaux
  const utilisateur = recupererUtilisateur();
  const lienHeroApprenant = utilisateur?.role === "apprenant" ? "/dashboard/apprenant" : "/formations";

  // Met à jour le titre de la page
  useEffect(() => {
    document.title = "SkillHub";
  }, []);

  useEffect(() => {
    const modeAuth = parametresRecherche.get("auth");
    if (!["connexion", "inscription"].includes(modeAuth)) return;

    const prochainsParametres = new URLSearchParams(parametresRecherche);
    prochainsParametres.delete("auth");
    setParametresRecherche(prochainsParametres, { replace: true });
  }, [parametresRecherche, setParametresRecherche]);

  // Charge les formations à mettre en avant
  useEffect(() => {
    let actif = true;
    const chargerFormations = async () => {
      try {
        const donnees = await listerFormations();
        if (!actif) return;
        setFormationsMisesEnAvant(donnees.slice(0, 9));
        setErreurFormations(false);
      } catch {
        if (!actif) return;
        setFormationsMisesEnAvant([]);
        setErreurFormations(true);
      }
    };
    chargerFormations();
    return () => { actif = false; };
  }, []);

  // Animation d'apparition des éléments au scroll
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    const elements = document.querySelectorAll(
      ".hero-highlight-card, .hero-stat-card, .guide-carte, .valeur-carte, .valeurs-illu, .valeurs-header, .valeurs-liste li, .temoignage-container, .temoignage-card",
    );
    elements.forEach((element) => {
      element.classList.add("reveal-on-scroll");
      observer.observe(element);
    });
    return () => { observer.disconnect(); };
  }, [formationsMisesEnAvant]);

  // Fait défiler automatiquement les témoignages
  useEffect(() => {
    if (!TEMOIGNAGES.length) return;
    const timer = window.setTimeout(() => {
      setDirectionTemoignages("next");
      setPointActif((precedent) => (precedent + 1) % TEMOIGNAGES.length);
    }, 5200);
    return () => { window.clearTimeout(timer); };
  }, [pointActif]);

  // Fait défiler automatiquement les formations populaires
  useEffect(() => {
    if (!formationsMisesEnAvant.length) return;
    const timer = window.setTimeout(() => {
      setDirectionFormations("next");
      setFormationActive((f) => (f + 1) % formationsMisesEnAvant.length);
    }, 6500);
    return () => { window.clearTimeout(timer); };
  }, [formationActive, formationsMisesEnAvant]);

  const changerTemoignage = (direction) => {
    setDirectionTemoignages(direction);
    setPointActif((p) => {
      if (direction === "prev") {
        return (p - 1 + TEMOIGNAGES.length) % TEMOIGNAGES.length;
      }

      return (p + 1) % TEMOIGNAGES.length;
    });
  };

  const changerFormation = (direction) => {
    if (!formationsMisesEnAvant.length) return;
    setDirectionFormations(direction);
    setFormationActive((f) => {
      if (direction === "prev") {
        return (f - 1 + formationsMisesEnAvant.length) % formationsMisesEnAvant.length;
      }

      return (f + 1) % formationsMisesEnAvant.length;
    });
  };

  // Rendu de la page d'accueil
  return (
    <>
      <PublicNavbar
        menuItems={[
          { label: "Accueil", to: "/" },
          { label: "Formations", to: "/formations" },
          { label: "À propos", href: "#" },
          { label: "Contact", href: "#footer" },
        ]}
      />

      <main id="contenu">
        <section className="hero" aria-labelledby="hero-title">
          <div className="illustration illu1">
            <img src="/assets/images/learning/learning-laptop.jpg" alt="" aria-hidden="true" />
          </div>
          <div className="illustration illu2">
            <img src="/assets/images/learning/learning-notes.jpg" alt="" aria-hidden="true" />
          </div>
          <h1 className="hero-titre" id="hero-title">
            Apprenez. <span className="progresse">Progressez</span>.<br />Réussissez ensemble.
          </h1>
          <p className="hero-texte">
            Des parcours clairs, des formateurs passionnés et une progression visible.
            SkillHub transforme chaque étape d'apprentissage en réussite concrète.
          </p>
          <div className="hero-boutons">
            <Link to={lienHeroApprenant} className="btn btn-formateur" role="button">Explorer les formations</Link>
            {utilisateur?.role === "formateur" ? (
              <Link to="/dashboard/formateur" className="btn btn-apprenant" role="button">Mon espace formateur</Link>
            ) : (
              <button type="button" className="btn btn-apprenant" onClick={() => setAuthModal("inscription")}>Devenir formateur</button>
            )}
          </div>
        </section>
      </main>

      <section className="guide" id="guide" aria-labelledby="guide-title">
        <div className="guide-header">
          <h2 id="guide-title">Comment ça marche ?</h2>
        </div>
        <div className="guide-cartes">
          <div className="guide-column guide-formateurs">
            <article className="guide-carte">
              <span className="guide-step">01</span>
              <div className="carte-header">
                <span className="guide-icon-wrapper guide-icon-wrapper--formateur">
                  <FontAwesomeIcon icon={faChalkboard} className="guide-fa-icon" aria-hidden="true" />
                </span>
                <h3 className="guide-titre">Créez votre cours</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Déposez facilement vos formations en ligne, ajoutez vos cours,
                configurez vos modules selon votre style d’enseignement.
                </p>
              </div>
            </article>
            <article className="guide-carte">
              <span className="guide-step">02</span>
              <div className="carte-header">
                <span className="guide-icon-wrapper guide-icon-wrapper--formateur">
                  <FontAwesomeIcon icon={faBullhorn} className="guide-fa-icon" aria-hidden="true" />
                </span>
                <h3 className="guide-titre">Publiez et atteignez vos élèves</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Une fois votre cours prêt, publiez-le et touchez une
                  communauté d’apprenants motivés. Suivez les progrès et
                  récoltez des avis pour améliorer votre impact.
                </p>
              </div>
            </article>
          </div>
          <div className="guide-column guide-apprenants">
            <article className="guide-carte">
              <span className="guide-step">01</span>
              <div className="carte-header">
                <span className="guide-icon-wrapper guide-icon-wrapper--apprenant">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="guide-fa-icon" aria-hidden="true" />
                </span>
                <h3 className="guide-titre">Explorez et choisissez</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Parcourez notre catalogue de formations par catégorie ou niveau,
                  comparez les cours et sélectionnez celui qui correspond à vos objectifs.
                </p>
              </div>
            </article>
            <article className="guide-carte">
              <span className="guide-step">02</span>
              <div className="carte-header">
                <span className="guide-icon-wrapper guide-icon-wrapper--apprenant">
                  <FontAwesomeIcon icon={faGraduationCap} className="guide-fa-icon" aria-hidden="true" />
                </span>
                <h3 className="guide-titre">Apprenez à votre rythme</h3>
              </div>
              <div className="guide-texte">
                <p>
                  Accédez à vos cours en ligne depuis n’importe quel appareil,
                  avancez à votre rythme, faites des quiz et suivez votre progression facilement.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="valeurs valeurs-highlights" aria-labelledby="valeurs-title">
        <div className="valeurs-inner">
          <div className="valeurs-illu">
            <img src="/assets/images/valeurs-illustration.png" alt="Apprenante utilisant SkillHub" />
          </div>
          <div className="valeurs-contenu">
            <div className="valeurs-header">
              <h2 id="valeurs-title">Nos valeurs</h2>
            </div>
            <ul className="valeurs-liste">
              <li>
                <strong>Sécurité</strong>
                <p>Vos données et votre progression sont protégées à chaque étape de votre parcours.</p>
              </li>
              <li>
                <strong>Excellence</strong>
                <p>Des formations de qualité, conçues et animées par des experts passionnés par leur domaine.</p>
              </li>
              <li>
                <strong>Accessibilité</strong>
                <p>Apprenez depuis n'importe où, à votre rythme, sans barrières techniques ni financières.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="temoignages" id="temoignages" aria-labelledby="temoignages-title">
        <div className="temoignages-inner">
          <div className="temoignages-gauche">
            <h2 id="temoignages-title">Ils nous font<br />confiance</h2>
            <div className="temoignages-nav">
              <button
                className="temoignage-btn"
                onClick={() => changerTemoignage("prev")}
                aria-label="Précédent"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                className="temoignage-btn temoignage-btn--actif"
                onClick={() => changerTemoignage("next")}
                aria-label="Suivant"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
          <div className={`temoignages-cartes${directionTemoignages ? ` carousel-${directionTemoignages}` : ""}`} aria-live="polite">
            {[0, 1].map((offset) => {
              const index = (pointActif + offset) % TEMOIGNAGES.length;
              const t = TEMOIGNAGES[index];
              return (
                <article className="temoignage-card" key={`${t.nom}-${offset}`}>
                  <span className="temoignage-guillemet" aria-hidden="true">"</span>
                  <img src={t.photo} className="temoignage-profil" alt="" />
                  <h3 className="temoignage-nom">{t.nom}</h3>
                  <p className="temoignage-role">{t.role}</p>
                  <p className="temoignage-texte">{t.texte}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="valeurs featured-formations" aria-labelledby="formations-mises-en-avant-title">
        <div className="valeurs-header">
          <h2 id="formations-mises-en-avant-title">Formations populaires</h2>
        </div>
        {!erreurFormations && formationsMisesEnAvant.length > 0 && (
          <div className="formations-carousel">
            <button
              className="formations-btn"
              onClick={() => changerFormation("prev")}
              aria-label="Formation précédente"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className={`formations-slide-track${directionFormations ? ` carousel-${directionFormations}` : ""}`} aria-live="polite">
              {[0, 1, 2].map((offset) => {
                const index = (formationActive + offset) % formationsMisesEnAvant.length;
                const formation = formationsMisesEnAvant[index];
                return (
                  <article className="featured-card" key={`${formation.id}-${offset}`}>
                    <div className="f-card-cover">
                      <img
                        src={formation.image_url || formation.imageUrl || IMAGES_APPRENTISSAGE[index % IMAGES_APPRENTISSAGE.length]}
                        alt=""
                        loading="lazy"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="f-card-body">
                      <h3 className="f-card-titre">{formation.titre}</h3>
                      <div className="f-card-stats">
                        <span><FontAwesomeIcon icon={faClock} className="f-stat-icon" aria-hidden="true" /> {libelleHeures(formation.duration ?? formation.duree)}</span>
                        <span><FontAwesomeIcon icon={faUserGraduate} className="f-stat-icon" aria-hidden="true" /> {formation.apprenants || 0} apprenants</span>
                      </div>
                      <hr className="f-card-sep" />
                    </div>
                    <div className="f-card-footer">
                      <Link to={`/formation/${formation.id}`} className="f-btn f-btn--info">Plus d'infos</Link>
                      <Link to={`/apprendre/${formation.id}`} className="f-btn f-btn--start">Commencer</Link>
                    </div>
                  </article>
                );
              })}
            </div>
            <button
              className="formations-btn"
              onClick={() => changerFormation("next")}
              aria-label="Formation suivante"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
        {erreurFormations && <p>Impossible de charger les formations mises en avant.</p>}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link to="/formations" className="btn btn-apprenant" role="button">Voir toutes les formations</Link>
        </div>
      </section>

      {authModal && <AuthModal modeInitial={authModal} onClose={() => setAuthModal(null)} />}

      <footer className="footer" id="footer">
        <div className="footer-container">
          <div className="footer_logo-p">
            <img src="/assets/images/logo.svg" alt="Logo de SkillHub" className="footer-logo" />
            <p className="footer-texte">Apprendre, partager et progresser ensemble.</p>
          </div>
          <nav className="footer-nav" aria-label="Navigation du footer">
            <h2 className="footer-titre">Navigation</h2>
            <ul className="footer-liste">
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/formations">Cours</Link></li>
              <li><a href="#temoignages">Communauté</a></li>
              <li><a href="#guide">À propos</a></li>
            </ul>
          </nav>
          <div className="footer_categ">
            <h2 className="footer-titre">Catégories</h2>
            <ul className="footer-liste">
              <li><Link to="/formations?categorie=dev">Développement web</Link></li>
              <li><Link to="/formations?categorie=design">Design</Link></li>
              <li><Link to="/formations?categorie=marketing">Marketing</Link></li>
              <li><Link to="/formations?categorie=business">Management</Link></li>
            </ul>
          </div>
          <div className="footer-social">
            <h2 className="footer-titre">Réseaux</h2>
            <div className="footer-social-liens">
              <a href="https://facebook.com" aria-label="Facebook" className="lien">
                <img src="/assets/images/facebook.svg" alt="" className="footer-icone" aria-hidden="true" />
                Facebook
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="lien">
                <img src="/assets/images/linkedin.svg" alt="" className="footer-icone" aria-hidden="true" />
                Linkedin
              </a>
              <a href="https://gmail.com" aria-label="Gmail" className="lien">
                <img src="/assets/images/gmail.svg" alt="" className="footer-icone" aria-hidden="true" />
                Mail
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SkillHub MCCI - Projet fil rouge Licence. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}

export default Accueil;
