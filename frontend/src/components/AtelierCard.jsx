import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import "../styles/formations-page.css";

const IMAGES_FORMATIONS = [
  "/assets/images/learning/learning-hero.jpg",
  "/assets/images/learning/learning-laptop.jpg",
  "/assets/images/learning/learning-notes.jpg",
  "/assets/images/learning/learning-team.jpg",
];

function obtenirPoints(description) {
  if (!description) return [];
  return description
    .split(/[.!?]/)
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function AtelierCard({
  image = null,
  titre,
  description,
  id = null,
  formateur = "Formateur SkillHub",
  inscrits,
  duration,
  actions = null,
}) {
  const imageCarte = image || IMAGES_FORMATIONS[Math.abs(String(titre).length) % IMAGES_FORMATIONS.length];
  const points = obtenirPoints(description);
  const lienDetail = id ? `/formation/${id}` : "/formations";
  const lienApprendre = id ? `/apprendre/${id}` : "/formations";

  return (
    <article className="f-card dashboard-f-card">
      <div className="f-card-cover">
        <img src={imageCarte} alt="" loading="lazy" aria-hidden="true" />
      </div>

      <div className="f-card-body">
        <h3 className="f-card-titre">{titre}</h3>
        <div className="f-card-stats">
          <span><FontAwesomeIcon icon={faClock} className="f-stat-icon" aria-hidden="true" /> {duration ?? 1} heure{Number(duration ?? 1) > 1 ? "s" : ""} de cours</span>
          <span><FontAwesomeIcon icon={faUserGraduate} className="f-stat-icon" aria-hidden="true" /> {inscrits ?? 0} apprenants</span>
        </div>
        <p className="f-card-auteur">Par {formateur}</p>
        <hr className="f-card-sep" />
        <p className="f-card-learn-title">Ce que vous apprendrez</p>
        {points.length > 0 ? (
          <ul className="f-card-bullets">
            {points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        ) : (
          <p className="f-card-no-desc">Aucune description disponible.</p>
        )}
      </div>

      <div className="f-card-footer">
        {actions || (
          <>
            <Link to={lienDetail} className="f-btn f-btn--info">Plus d'infos</Link>
            <Link to={lienApprendre} className="f-btn f-btn--start">Commencer</Link>
          </>
        )}
      </div>
    </article>
  );
}

AtelierCard.propTypes = {
  image: PropTypes.string,
  titre: PropTypes.string.isRequired,
  description: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formateur: PropTypes.string,
  date: PropTypes.string,
  statut: PropTypes.string,
  inscrits: PropTypes.number,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  duration: PropTypes.number,
  level: PropTypes.string,
  actions: PropTypes.node,
};

export default AtelierCard;
