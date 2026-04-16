import axios from "axios";
import { recupererJeton, supprimerSession } from "./auth";

const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8001/api",
  headers: { "Content-Type": "application/json" },
});

apiAuth.interceptors.request.use((config) => {
  const jeton = recupererJeton();
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

apiAuth.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) supprimerSession();
    return Promise.reject(erreur);
  },
);

export async function inscrire(nom, email, motDePasse, role) {
  const reponse = await apiAuth.post("/inscription", {
    nom,
    email,
    mot_de_passe: motDePasse,
    role,
  });

  return reponse.data;
}

export async function connecter(email, motDePasse) {
  const reponse = await apiAuth.post("/connexion", {
    email,
    mot_de_passe: motDePasse,
  });

  return reponse.data;
}

export async function profilConnecte() {
  const reponse = await apiAuth.get("/profil");
  return reponse.data;
}

export async function deconnecter() {
  await apiAuth.post("/deconnexion");
}
