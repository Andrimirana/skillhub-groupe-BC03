import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import { listerFormations } from "../services/formationsApi";
import { recupererUtilisateur } from "../services/auth";
import PublicNavbar from "../components/PublicNavbar";
import "../styles/formations-page.css";

const CATEGORIES = ["", "dev", "design", "business", "marketing"];
const LABELS_CATEGORIES = {
  "": "Toutes",
  dev: "Développement",
  design: "Design",
  business: "Business",
  marketing: "Marketing",
};

const IMAGES_FORMATIONS = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
];

function mapperCategorie(category) {
  const valeur = (category || "").toLowerCase();

  if (valeur.includes("développement") || valeur.includes("developpement") || valeur.includes("web")) {
    return "dev";
  }

  if (valeur.includes("design")) {
    return "design";
  }

  if (valeur.includes("marketing")) {
    return "marketing";
  }

  if (valeur.includes("data") || valeur.includes("devops")) {
    return "business";
  }

  return "dev";
}

function libelleHeures(nombreHeures) {
  const heures = Number(nombreHeures || 0);
  return `${heures || 1} heure${heures > 1 ? "s" : ""} de cours`;
}

function obtenirPoints(description) {
  if (!description) return [];
  return description
    .split(/[.;]/).map((s) => s.trim()).filter((s) => s.length > 8).slice(0, 3);
}

function Formations() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [niveau, setNiveau] = useState("");
  const [formations, setFormations] = useState([]);
  const [formationsFiltrees, setFormationsFiltrees] = useState([]);
  const [erreur, setErreur] = useState(false);
  const utilisateur = recupererUtilisateur();
  const estFormateur = utilisateur?.role === "formateur";

  useEffect(() => {
    document.title = "Formations";
  }, []);

  useEffect(() => {
    let actif = true;

    const charger = async () => {
      try {
        const data = await listerFormations();

        if (!actif) {
          return;
        }

        const normalisees = (data || []).map((item) => ({
          id: item.id,
          nom: item.titre || "Formation",
          description: item.description || "",
          formateur: item.formateur || "N/A",
          prix: Number(item.price || 0),
          duree: Number(item.duration || 0),
          categorie: mapperCategorie(item.category),
          level: item.level || "beginner",
          apprenants: Number(item.apprenants || 0),
          vues: Number(item.vues || 0),
        }));

        setFormations(normalisees);
        setFormationsFiltrees(normalisees);
        setErreur(false);
      } catch {
        if (!actif) {
          return;
        }

        setFormations([]);
        setFormationsFiltrees([]);
        setErreur(true);
      }
    };

    charger();

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    const temporisation = globalThis.setTimeout(() => {
      const query = recherche.trim().toLowerCase();
      const resultat = formations.filter((formation) => {
        const matchQuery =
          formation.nom.toLowerCase().includes(query)
          || formation.description.toLowerCase().includes(query)
          || formation.categorie.toLowerCase().includes(query);

        const matchFiltres =
          (categorie === "" || formation.categorie === categorie)
          && (niveau === "" || formation.level === niveau);

        return matchQuery && matchFiltres;
      });

      setFormationsFiltrees(resultat);
    }, 180);

    return () => {
      globalThis.clearTimeout(temporisation);
    };
  }, [recherche, categorie, niveau, formations]);

  const fermerModal = () => setModalOuverte(false);
  const soumettreModal = (e) => { e.preventDefault(); navigate("/inscription"); };

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
          <div className="title">
            <h1 id="hero-title">Découvre nos formations</h1>
            <p>Explore des parcours modernes, orientés pratique et progression continue.</p>
          </div>
          <form className="search barre-recherche" aria-label="Recherche sur le site" role="search">
            <div className="search-input">
              <input
                type="text"
                id="search-bar"
                name="search"
                placeholder="Rechercher une formation..."
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
              />
            </div>
          </form>
        </section>

        <section className="formations" aria-label="Formations disponibles">
          <aside className="filtre" aria-labelledby="filtre-title">
            <h2 id="filtre-title">Filtrer par :</h2>
            <label htmlFor="categoryFilter">Catégorie</label>
            <select id="categoryFilter" name="category" value={categorie} onChange={(event) => setCategorie(event.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option || "all"} value={option}>{LABELS_CATEGORIES[option]}</option>
              ))}
            </select>
            <label htmlFor="levelFilter">Niveau</label>
            <select id="levelFilter" name="level" value={niveau} onChange={(event) => setNiveau(event.target.value)}>
              <option value="">Tous</option>
              <option value="beginner">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>
          </aside>
          <div className="cards-container" id="cardsContainer" aria-live="polite">
            {erreur && <p>Impossible de charger les formations.</p>}
            {!erreur && formationsFiltrees.length === 0 && <p>Aucune formation trouvée.</p>}
            {!erreur && formationsFiltrees.map((formation, index) => (
              <article className="f-card" key={formation.id}>
                <div className="f-card-cover">
                  <img
                    src={IMAGES_FORMATIONS[index % IMAGES_FORMATIONS.length]}
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                <div className="f-card-body">
                  <h3 className="f-card-titre">{formation.nom}</h3>
                  <div className="f-card-stats">
                    <span><FontAwesomeIcon icon={faClock} className="f-stat-icon" aria-hidden="true" /> {libelleHeures(formation.duree)}</span>
                    <span><FontAwesomeIcon icon={faUserGraduate} className="f-stat-icon" aria-hidden="true" /> {formation.apprenants || 0} apprenants</span>
                  </div>
                  <p className="f-card-auteur">Par {formation.formateur || "Formateur SkillHub"}</p>
                  <hr className="f-card-sep" />
                  <p className="f-card-learn-title">Ce que vous apprendrez</p>
                  <ul className="f-card-bullets">
                    {obtenirPoints(formation.description).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                  {(!formation.description || obtenirPoints(formation.description).length === 0) && (
                    <p className="f-card-no-desc">Aucune description disponible.</p>
                  )}
                </div>
                <div className="f-card-footer">
                  {estFormateur ? (
                    <span className="f-btn f-btn--disabled">Réservé aux apprenants</span>
                  ) : (
                    <>
                      <Link to={`/formation/${formation.id}`} className="f-btn f-btn--info">Plus d'infos</Link>
                      <Link to={`/apprendre/${formation.id}`} className="f-btn f-btn--start">Commencer</Link>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {modalOuverte && (
        <div id="modalOverlay" className="overlay" aria-hidden="true" onClick={fermerModal} onKeyDown={fermerModal}></div>
      )}
      {modalOuverte && (
        <div id="modal" className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title-formations" ref={modalRef}>
          <h2 id="modal-title-formations">Rejoindre SkillHub</h2>
          <p className="modal-subtitle">Créez votre compte gratuitement</p>
          <form onSubmit={soumettreModal}>
            <div className="champ">
              <label htmlFor="f-modal-nom">Nom</label>
              <input id="f-modal-nom" type="text" placeholder="Votre nom" required />
            </div>
            <div className="champ">
              <label htmlFor="f-modal-email">Email</label>
              <input id="f-modal-email" type="email" placeholder="votre@email.com" required />
            </div>
            <div className="champ">
              <label htmlFor="f-modal-mdp">Mot de passe</label>
              <input id="f-modal-mdp" type="password" placeholder="••••••••" required />
            </div>
            <div className="modal-actions">
              <button type="submit">Créer le compte</button>
              <button type="button" onClick={fermerModal}>Annuler</button>
            </div>
          </form>
          <p className="modal-login-link">
            Déjà inscrit ?{" "}
            <Link to="/connexion" onClick={fermerModal}>Se connecter</Link>
          </p>
        </div>
      )}

      <footer className="footer" id="footer">
        <div className="footer-container">
          <div className="footer_logo-p">
            <img src="/assets/images/logo.svg" alt="Logo de SkillHub" className="footer-logo" />
            <p className="footer-texte">Apprendre, partager et progresser ensemble.</p>
          </div>
          <nav className="footer-nav" aria-label="Navigation du footer">
            <h2 className="footer-titre">Navigation</h2>
            <ul className="footer-liste">
              <li><a href="#">Accueil</a></li>
              <li><a href="#">Cours</a></li>
              <li><a href="#">Communauté</a></li>
              <li><a href="#">À propos</a></li>
            </ul>
          </nav>
          <div className="footer_categ">
            <h2 className="footer-titre">Catégories</h2>
            <ul className="footer-liste">
              <li><a href="#">Développement web</a></li>
              <li><a href="#">Design</a></li>
              <li><a href="#">Marketing</a></li>
              <li><a href="#">Management</a></li>
            </ul>
          </div>
          <div className="footer-social">
            <h2 className="footer-titre">Réseaux</h2>
            <div className="footer-social-liens">
              <a href="https://facebook.com" aria-label="Facebook" className="lien">
                <img src="/assets/images/facebook.svg" alt="" className="footer-icone" />
                Facebook
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="lien">
                <img src="/assets/images/linkedin.svg" alt="" className="footer-icone" />
                Linkedin
              </a>
              <a href="https://gmail.com" aria-label="Gmail" className="lien">
                <img src="/assets/images/gmail.svg" alt="" className="footer-icone" />
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

export default Formations;
