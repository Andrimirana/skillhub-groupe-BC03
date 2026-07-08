// Importe la librairie pour le chiffrement
import CryptoJS from "crypto-js";

/**
 * Calcule le payload de connexion HMAC-SHA256 pour le protocole Spring Boot.
 * Le mot de passe sert de clé HMAC (jamais envoyé sur le réseau).
 * hmac = HMAC_SHA256(key=motDePasse, data="email:nonce:timestamp") en Base64
 *
 * @param {string} email     - Email de l'utilisateur
 * @param {string} motDePasse - Mot de passe (utilisé comme clé, non transmis)
 * @returns {{ email, nonce, timestamp, hmac }} Corps de la requête POST /api/login
 */
export const construirePayloadLogin = (email, motDePasse) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const donnees = `${email}:${nonce}:${timestamp}`;
  const hmac = CryptoJS.HmacSHA256(donnees, motDePasse).toString(CryptoJS.enc.Base64);
  return { email, nonce, timestamp, hmac };
};
