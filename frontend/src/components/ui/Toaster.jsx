import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import { ecouterNotifications } from "../../services/feedback";
import "../../styles/ui-feedback.css";

const ICONES = {
  succes: faCircleCheck,
  erreur: faCircleExclamation,
  info: faCircleInfo,
};

const DUREE_AFFICHAGE = 4200;

// Pile de notifications affichée en bas à droite de l'écran
function Toaster() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => ecouterNotifications((notification) => {
    setNotifications((precedentes) => [...precedentes.slice(-3), notification]);
    window.setTimeout(() => {
      setNotifications((precedentes) => precedentes.filter((item) => item.id !== notification.id));
    }, DUREE_AFFICHAGE);
  }), []);

  const fermer = (id) => setNotifications((precedentes) => precedentes.filter((item) => item.id !== id));

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast--${notification.type}`}
          role={notification.type === "erreur" ? "alert" : "status"}
        >
          <FontAwesomeIcon icon={ICONES[notification.type] || faCircleInfo} className="toast-icone" aria-hidden="true" />
          <p>{notification.message}</p>
          <button type="button" className="toast-fermer" onClick={() => fermer(notification.id)} aria-label="Fermer la notification">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
