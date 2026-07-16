import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/summary.css";

// Indicateurs du tableau de bord.
function Summary({ items }) {
  return (
    <div className="summary_dash">
      {items.map((item, index) => (
        <div className={`summary_card ${item.tone ? `summary_card--${item.tone}` : ""}`} key={index}>
          {item.icon && (
            <span className="summary_icon" aria-hidden="true">
              <FontAwesomeIcon icon={item.icon} />
            </span>
          )}
          <p>{item.value}</p>
          <h3>{item.label}</h3>
          {item.description && <small>{item.description}</small>}
        </div>
      ))}
    </div>
  );
}

Summary.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.shape({}),
    tone: PropTypes.string,
  })).isRequired,
};

export default Summary;
