// services/auth.js
/*
| Projet: SkillHub
| Rôle du fichier: Gestion de la session d'authentification côté client (stockage du token JWT et des infos utilisateur dans localStorage).
*/
const CLE_JETON = "jeton_auth";
const CLE_UTILISATEUR = "utilisateur_auth";

function nettoyerTexte(valeur) {
  return typeof valeur === "string" ? valeur.trim().slice(0, 255) : "";
}

function normaliserUtilisateur(utilisateur) {
  if (!utilisateur || typeof utilisateur !== "object") {
    return null;
  }

  return {
    id: utilisateur.id ?? null,
    nom: nettoyerTexte(utilisateur.nom),
    email: nettoyerTexte(utilisateur.email).toLowerCase(),
    role: ["apprenant", "formateur", "administrateur", "admin"].includes(utilisateur.role) ? utilisateur.role : "apprenant",
    avatar_url: nettoyerTexte(utilisateur.avatar_url),
  };
}

export function sauvegarderSession(token, utilisateur) {
  if (typeof token !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return;
  const utilisateurNormalise = normaliserUtilisateur(utilisateur);
  if (!utilisateurNormalise) return;

  localStorage.setItem(CLE_JETON, token); // NOSONAR - JWT format validated before storage.
  localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(utilisateurNormalise)); // NOSONAR - user payload is normalized before storage.
}

export function recupererJeton() {
  return localStorage.getItem(CLE_JETON);
}

export function recupererUtilisateur() {
  const utilisateur = localStorage.getItem(CLE_UTILISATEUR);

  if (!utilisateur) {
    return null;
  }

  try {
    return JSON.parse(utilisateur);
  } catch {
    return null;
  }
}

export function mettreAJourUtilisateurSession(donneesUtilisateur) {
  const utilisateurActuel = recupererUtilisateur();

  if (!utilisateurActuel) {
    return null;
  }

  const utilisateurMisAJour = {
    ...utilisateurActuel,
    ...donneesUtilisateur,
  };

  const utilisateurNormalise = normaliserUtilisateur(utilisateurMisAJour);
  if (!utilisateurNormalise) return null;

  localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(utilisateurNormalise)); // NOSONAR - user payload is normalized before storage.
  return utilisateurNormalise;
}

export function supprimerSession() {
  localStorage.removeItem(CLE_JETON);
  localStorage.removeItem(CLE_UTILISATEUR);
}

export function estConnecte() {
  return Boolean(recupererJeton());
}
