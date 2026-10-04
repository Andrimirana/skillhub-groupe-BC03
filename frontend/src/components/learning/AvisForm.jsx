import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { donnerAvis } from "../../services/formationsApi";

// Formulaire permettant à un apprenant inscrit de noter la formation
function AvisForm({ idFormation, noteInitiale, commentaireInitial }) {
  const [note, setNote] = useState(noteInitiale || 0);
  const [commentaire, setCommentaire] = useState(commentaireInitial || "");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const dejaNote = Boolean(noteInitiale);

  const envoyer = async (evenement) => {
    evenement.preventDefault();
    setMessage("");
    setErreur("");

    if (note < 1) {
      setErreur("Choisissez une note entre 1 et 5 étoiles.");
      return;
    }

    if (commentaire.trim().length < 3) {
      setErreur("Écrivez un commentaire d'au moins 3 caractères.");
      return;
    }

    try {
      setEnvoiEnCours(true);
      await donnerAvis(idFormation, note, commentaire.trim());
      setMessage("Merci, votre avis a été enregistré.");
    } catch (e) {
      setErreur(e.response?.data?.message || "Impossible d'enregistrer votre avis.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <form className="learn-content-card avis-form" onSubmit={envoyer}>
      <h2>{dejaNote ? "Modifier votre avis" : "Donnez votre avis"}</h2>
      <div className="avis-etoiles" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((valeur) => (
          <button
            key={valeur}
            type="button"
            role="radio"
            aria-checked={note === valeur}
            aria-label={`${valeur} étoile${valeur > 1 ? "s" : ""}`}
            className={valeur <= note ? "avis-etoile avis-etoile--active" : "avis-etoile"}
            onClick={() => setNote(valeur)}
          >
            <FontAwesomeIcon icon={faStar} />
          </button>
        ))}
      </div>
      <textarea
        value={commentaire}
        onChange={(evenement) => setCommentaire(evenement.target.value)}
        placeholder="Qu'avez-vous pensé de cette formation ?"
        rows={3}
        maxLength={1000}
      />
      {erreur && <p className="avis-erreur">{erreur}</p>}
      {message && <p className="avis-succes">{message}</p>}
      <button type="submit" className="avis-envoyer" disabled={envoiEnCours}>
        {envoiEnCours ? "Envoi..." : "Publier mon avis"}
      </button>
    </form>
  );
}

export default AvisForm;
