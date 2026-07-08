// Fichier : authApi.js
// Rôle    : Fournit les fonctions pour l'inscription, la connexion, la déconnexion et la validation du profil connecté en interagissant avec le backend d'authentification Spring Boot.
// Modifié : 2026-06-01

import axios from "axios";
import { construirePayloadLogin } from "../utils/security";
import { recupererJeton, supprimerSession } from "./auth";

const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8001/api",
  timeout: 10000,
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

/**
 * Inscrit un nouvel utilisateur.
 * POST /api/register — {nom, email, password, passwordConfirm, role}
 * Réponse : {token, tokenType, expiresAt, utilisateur}
 */
export async function inscrire(nom, email, motDePasse, role) {
  const reponse = await apiAuth.post("/register", {
    nom,
    email,
    password: motDePasse,
    passwordConfirm: motDePasse,
    role,
  });
  return reponse.data;
}

/**
 * Authentifie un utilisateur via HMAC-SHA256.
 * POST /api/login — {email, nonce, timestamp, hmac}
 * Le mot de passe sert de clé HMAC et n'est jamais envoyé sur le réseau.
 * Réponse : {token, tokenType, expiresAt, utilisateur}
 */
export async function connecter(email, motDePasse) {
  const payload = construirePayloadLogin(email, motDePasse);
  const reponse = await apiAuth.post("/login", payload);
  return reponse.data;
}

export async function profilConnecte() {
  const reponse = await apiAuth.get("/profil");
  return reponse.data;
}

export async function deconnecter() {
  await apiAuth.post("/logout");
}
