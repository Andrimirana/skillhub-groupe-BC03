import api from "./api";

export async function inscrire(nom, email, motDePasse, role) {
  const reponse = await api.post("/inscription", {
    nom,
    email,
    mot_de_passe: motDePasse,
    role,
  });

  return reponse.data;
}

export async function connecter(email, motDePasse) {
  const reponse = await api.post("/connexion", {
    email,
    mot_de_passe: motDePasse,
  });

  return reponse.data;
}

export async function profilConnecte() {
  const reponse = await api.get("/profil");
  return reponse.data;
}

export async function deconnecter() {
  await api.post("/deconnexion");
}
