/*
| Projet: SkillHub
| Rôle du fichier: Client HTTP vers le service Inscription (port 8003)
*/

import axios from "axios";
import { recupererJeton, supprimerSession } from "./auth";

// Client API Axios pour le service Inscription
const inscriptionApi = axios.create({
  baseURL: import.meta.env.VITE_INSCRIPTION_URL || "http://127.0.0.1:8003/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor pour ajouter le token d'authentification à chaque requête
inscriptionApi.interceptors.request.use((configuration) => {
  const jeton = recupererJeton();
  if (jeton) {
    configuration.headers.Authorization = `Bearer ${jeton}`;
  }
  return configuration;
});

// Interceptor pour gérer les erreurs de réponse, notamment les erreurs 401 pour la déconnexion automatique.
inscriptionApi.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      supprimerSession();
    }
    return Promise.reject(erreur);
  },
);

export default inscriptionApi;
