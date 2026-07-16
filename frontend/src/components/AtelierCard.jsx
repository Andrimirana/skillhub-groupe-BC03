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

function AtelierCard({
  image = null,
  titre,
  id = null,
  inscrits,
  duration,
  actions = null,
}) {
  const imageCarte = image || IMAGES_FORMATIONS[Math.abs(String(titre).length) % IMAGES_FORMATIONS.length];
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
        <hr className="f-card-sep" />
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
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  date: PropTypes.string,
  statut: PropTypes.string,
  inscrits: PropTypes.number,
  duration: PropTypes.number,
  level: PropTypes.string,
  actions: PropTypes.node,
};

export default AtelierCard;
