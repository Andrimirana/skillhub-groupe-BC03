import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { ecouterConfirmations } from "../../services/feedback";
import "../../styles/ui-feedback.css";

// Boîte de confirmation accessible, ouverte via confirmer() depuis n'importe quelle page
function ConfirmDialog() {
  const [demande, setDemande] = useState(null);
  const boutonAnnulerRef = useRef(null);
  const elementPrecedentRef = useRef(null);

  useEffect(() => ecouterConfirmations((nouvelleDemande) => {
    elementPrecedentRef.current = document.activeElement;
    setDemande(nouvelleDemande);
  }), []);

  const repondre = useCallback((valeur) => {
    if (!demande) return;
    demande.resoudre(valeur);
    setDemande(null);
    elementPrecedentRef.current?.focus?.();
  }, [demande]);

  useEffect(() => {
    if (!demande) return undefined;

    boutonAnnulerRef.current?.focus();

    const gererClavier = (evenement) => {
      if (evenement.key === "Escape") repondre(false);
    };

    window.addEventListener("keydown", gererClavier);
    return () => window.removeEventListener("keydown", gererClavier);
  }, [demande, repondre]);

  if (!demande) return null;

  return (
    <div className="confirm-overlay" onClick={() => repondre(false)}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titre"
        aria-describedby={demande.message ? "confirm-message" : undefined}
        onClick={(evenement) => evenement.stopPropagation()}
      >
        <span className={`confirm-icone ${demande.danger ? "confirm-icone--danger" : ""}`} aria-hidden="true">
          <FontAwesomeIcon icon={demande.danger ? faTriangleExclamation : faCircleQuestion} />
        </span>
        <h2 id="confirm-titre">{demande.titre}</h2>
        {demande.message && <p id="confirm-message">{demande.message}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn-secondary" ref={boutonAnnulerRef} onClick={() => repondre(false)}>
            {demande.libelleAnnuler}
          </button>
          <button
            type="button"
            className={demande.danger ? "btn-danger-plein" : "btn-create"}
            onClick={() => repondre(true)}
          >
            {demande.libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
