// Importe la librairie pour le chiffrement
import CryptoJS from "crypto-js";

// Fonction pour générer les headers de sécurité
export const getSecurityHeaders = (data) => {
  const timestamp = Math.floor(Date.now() / 1000);
  // Récupère le timestamp actuel
  const bytes = new Uint8Array(6);
  // Génère un nonce aléatoire
  crypto.getRandomValues(bytes);
  // Construit le nonce sous forme de chaîne
  const nonce =
    "front_" +
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  //  On fixe le body en string UNE SEULE FOIS
  const bodyString = JSON.stringify(data);
  // Convertit les données en chaîne JSON
  const payload = bodyString + nonce + timestamp;
  // Concatène les données pour le hash
  const secret = import.meta.env.VITE_APP_MASTER_KEY;

  // Récupère la clé secrète depuis les variables d'environnement
  const signature = CryptoJS.HmacSHA256(payload, secret).toString(
    CryptoJS.enc.Hex,
  );

  // Calcule la signature HMAC
  return {
    // Retourne les headers de sécurité
    headers: {
      "X-Nonce": nonce,
      "X-Timestamp": timestamp,
      "X-HMAC-Signature": signature,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: bodyString,
  };
};
