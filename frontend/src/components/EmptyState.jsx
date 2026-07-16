import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@fortawesome/free-solid-svg-icons";
import "../styles/ui-system.css";

function EmptyState({
  icon = faInbox,
  title,
  description,
  action = null,
  compact = false,
}) {
  return (
    <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}>
      <span className="empty-state-icon" aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.object,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  compact: PropTypes.bool,
};

export default EmptyState;
