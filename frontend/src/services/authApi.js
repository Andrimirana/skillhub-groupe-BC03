import axios from 'axios';
import { getSecurityHeaders } from '../utils/security';
import { recupererJeton } from './auth';

const API_URL = import.meta.env.VITE_AUTH_URL;

export const connecter = async (email, mot_de_passe) => {
    const data = { email, mot_de_passe };
    const { headers, body } = getSecurityHeaders(data);

    const response = await axios.post(`${API_URL}/login`, body, { headers });
    
    return response.data;
};

export const inscrire = async (nom, email, mot_de_passe, role) => {
    const data = { nom, email, mot_de_passe, role };
    const { headers, body } = getSecurityHeaders(data);

    const response = await axios.post(`${API_URL}/register`, body, { headers });
    
    return response.data;
};

export const deconnecter = async () => {
    // On récupère le token stocké
    const token = recupererJeton();
    if (token) {
        try {
            // On prévient le backend pour qu'il place le token sur la Blacklist
            await axios.post(`${API_URL}/logout`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error("Erreur lors de la déconnexion côté serveur", error);
        }
    }
};

export const profilConnecte = async () => {
    const token = recupererJeton();
    if (!token) {
        throw new Error("Aucun jeton d'authentification trouvé.");
    }

    const response = await axios.get(`${API_URL}/profil`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    return response.data;
};