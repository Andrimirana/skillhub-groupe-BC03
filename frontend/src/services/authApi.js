// Fichier : authApi.js
// Rôle    : Fournit les fonctions pour l'inscription, la connexion, la déconnexion et la validation du profil connecté en interagissant avec le backend d'authentification.
// Modifié : 2026-04-21

import axios from "axios";
import { getSecurityHeaders } from "../utils/security";
import { recupererJeton, supprimerSession } from "./auth";

const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8001/api",
  headers: { "Content-Type": "application/json" },
});

// Interceptor pour ajouter le token d'authentification à chaque requête
apiAuth.interceptors.request.use((config) => {
  const jeton = recupererJeton();
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

// Interceptor pour gérer les erreurs de réponse, notamment les erreurs 401 pour la déconnexion automatique.
apiAuth.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) supprimerSession();
    return Promise.reject(erreur);
  },
);

export async function inscrire(nom, email, motDePasse, role) {
  const data = { nom, email, mot_de_passe: motDePasse, role };
  const { headers, body } = getSecurityHeaders(data);
  const reponse = await apiAuth.post("/register", body, { headers });
  return reponse.data;
}

// Fonction pour se connecter : envoie les identifiants, reçoit le token JWT et les infos utilisateur, et gère les erreurs de connexion.
export async function connecter(email, motDePasse) {
  const data = { email, mot_de_passe: motDePasse };
  const { headers, body } = getSecurityHeaders(data);
  const reponse = await apiAuth.post("/login", body, { headers });
  return reponse.data;
}

export async function profilConnecte() {
  const reponse = await apiAuth.get("/profil");
  return reponse.data;
}

// Fonction pour se déconnecter : envoie une requête de déconnexion au backend et supprime la session locale.

export async function deconnecter() {
  await apiAuth.post("/logout");
}
