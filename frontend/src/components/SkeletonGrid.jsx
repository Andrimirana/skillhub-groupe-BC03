import PropTypes from "prop-types";
import "../styles/ui-system.css";

function SkeletonGrid({ count = 6, variant = "cards" }) {
  return (
    <div className={`skeleton-grid skeleton-grid--${variant}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <span className="skeleton-cover" />
          <span className="skeleton-line skeleton-line--wide" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line--short" />
          <div className="skeleton-actions">
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonGrid.propTypes = {
  count: PropTypes.number,
  variant: PropTypes.string,
};

export default SkeletonGrid;
