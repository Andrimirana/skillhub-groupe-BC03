// Retours visuels partagés par toute l'application : notifications et confirmations.
// Les composants Toaster et ConfirmDialog (montés une fois dans App) écoutent ces événements.

const abonnesNotifications = new Set();
const abonnesConfirmations = new Set();
let compteur = 0;

export function ecouterNotifications(rappel) {
  abonnesNotifications.add(rappel);
  return () => abonnesNotifications.delete(rappel);
}

export function ecouterConfirmations(rappel) {
  abonnesConfirmations.add(rappel);
  return () => abonnesConfirmations.delete(rappel);
}

// Affiche une notification courte. type : "succes", "erreur" ou "info".
export function notifier(message, type = "succes") {
  compteur += 1;
  const notification = { id: compteur, message, type };
  abonnesNotifications.forEach((rappel) => rappel(notification));
}

export const notifierSucces = (message) => notifier(message, "succes");
export const notifierErreur = (message) => notifier(message, "erreur");
export const notifierInfo = (message) => notifier(message, "info");

// Ouvre une boîte de confirmation et renvoie une promesse résolue à true ou false.
export function confirmer({
  titre,
  message = "",
  libelleConfirmer = "Confirmer",
  libelleAnnuler = "Annuler",
  danger = false,
}) {
  if (abonnesConfirmations.size === 0) {
    return Promise.resolve(window.confirm(message ? `${titre}\n\n${message}` : titre));
  }

  return new Promise((resoudre) => {
    abonnesConfirmations.forEach((rappel) =>
      rappel({ titre, message, libelleConfirmer, libelleAnnuler, danger, resoudre }),
    );
  });
}

// Message d'erreur lisible à partir d'une réponse d'API.
export function messageErreurApi(erreur, messageParDefaut) {
  const donnees = erreur?.response?.data;

  if (donnees?.errors) {
    const premier = Object.values(donnees.errors).flat()[0];
    if (premier) return premier;
  }

  if (donnees?.message) return donnees.message;

  if (!erreur?.response) {
    return "Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.";
  }

  return messageParDefaut;
}
