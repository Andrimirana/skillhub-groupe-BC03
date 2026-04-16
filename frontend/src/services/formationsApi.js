import axios from "axios";
import api from "./api";
import { recupererJeton, supprimerSession } from "./auth";

const apiInscription = axios.create({
  baseURL: import.meta.env.VITE_INSCRIPTION_URL || "http://127.0.0.1:8003/api",
  headers: { "Content-Type": "application/json" },
});

apiInscription.interceptors.request.use((config) => {
  const jeton = recupererJeton();
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

apiInscription.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) supprimerSession();
    return Promise.reject(erreur);
  },
);

export async function listerFormations(filtres = {}) {
  const reponse = await api.get("/formations", { params: filtres });
  return reponse.data;
}

export async function detailFormation(idFormation) {
  const reponse = await api.get(`/formations/${idFormation}`);
  return reponse.data;
}

export async function listerModules(idFormation) {
  const reponse = await api.get(`/formations/${idFormation}/modules`);
  return reponse.data;
}

export async function creerModule(idFormation, donnees) {
  const reponse = await api.post(`/formations/${idFormation}/modules`, donnees);
  return reponse.data;
}

export async function modifierModule(idModule, donnees) {
  const reponse = await api.put(`/modules/${idModule}`, donnees);
  return reponse.data;
}

export async function supprimerModule(idModule) {
  const reponse = await api.delete(`/modules/${idModule}`);
  return reponse.data;
}

export async function listerMesFormations() {
  const reponse = await api.get("/my-formations");
  return reponse.data;
}

export async function creerFormation(donnees) {
  const reponse = await api.post("/formations", donnees);
  return reponse.data;
}

export async function modifierFormation(idFormation, donnees) {
  const reponse = await api.put(`/formations/${idFormation}`, donnees);
  return reponse.data;
}

export async function supprimerFormation(idFormation) {
  const reponse = await api.delete(`/formations/${idFormation}`);
  return reponse.data;
}

export async function inscrireFormation(idFormation) {
  const reponse = await apiInscription.post(`/formations/${idFormation}/inscription`);
  return reponse.data;
}

export async function desinscrireFormation(idFormation) {
  const reponse = await apiInscription.delete(`/formations/${idFormation}/inscription`);
  return reponse.data;
}

export async function listerFormationsApprenant() {
  const reponse = await apiInscription.get("/apprenant/formations");
  return reponse.data;
}
