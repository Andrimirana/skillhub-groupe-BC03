import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import "../../styles/ui-feedback.css";

// Fil d'Ariane : indique où l'on se trouve et permet de revenir en arrière en un clic
function FilAriane({ etapes }) {
  return (
    <nav className="fil-ariane" aria-label="Fil d'Ariane">
      <ol>
        {etapes.map((etape, index) => {
          const derniere = index === etapes.length - 1;
          return (
            <li key={`${etape.libelle}-${index}`}>
              {etape.lien && !derniere ? (
                <Link to={etape.lien}>{etape.libelle}</Link>
              ) : (
                <span aria-current={derniere ? "page" : undefined}>{etape.libelle}</span>
              )}
              {!derniere && <FontAwesomeIcon icon={faChevronRight} className="fil-ariane-separateur" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

FilAriane.propTypes = {
  etapes: PropTypes.arrayOf(PropTypes.shape({
    libelle: PropTypes.string.isRequired,
    lien: PropTypes.string,
  })).isRequired,
};

export default FilAriane;
