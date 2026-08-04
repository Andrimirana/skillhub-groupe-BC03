import axios from "axios";
import { recupererJeton, supprimerSession } from "./auth";

const apiAdmin = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://127.0.0.1:8001/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

apiAdmin.interceptors.request.use((config) => {
  const jeton = recupererJeton();
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

apiAdmin.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) supprimerSession();
    return Promise.reject(error);
  },
);

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function chargerUtilisateursAdmin(params) {
  return unwrap(await apiAdmin.get("/admin/users", { params }));
}

export async function chargerStatsUtilisateursAdmin() {
  return unwrap(await apiAdmin.get("/admin/users/stats"));
}

export async function chargerDetailUtilisateurAdmin(id) {
  return unwrap(await apiAdmin.get(`/admin/users/${id}`));
}

export async function modifierUtilisateurAdmin(id, payload) {
  return unwrap(await apiAdmin.put(`/admin/users/${id}`, payload));
}

export async function changerRoleUtilisateurAdmin(id, role) {
  return unwrap(await apiAdmin.patch(`/admin/users/${id}/role`, { role }));
}

export async function changerStatutUtilisateurAdmin(id, status, reason = "") {
  return unwrap(await apiAdmin.patch(`/admin/users/${id}/status`, { status, reason }));
}

export async function supprimerUtilisateurAdmin(id) {
  return unwrap(await apiAdmin.delete(`/admin/users/${id}`));
}

export async function actionGroupeeUtilisateursAdmin(action, ids, value = "") {
  return unwrap(await apiAdmin.post("/admin/users/bulk", { action, ids, value }));
}
