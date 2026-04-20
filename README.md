# SkillHub — Projet Final

Plateforme de formation en ligne réunissant une interface publique statique (EC03), un dashboard React (EC04) et une API REST Laravel avec JWT.

---

## Structure du projet

```
skillhub-final/
├── backend/          → API REST Laravel 12 (PHP 8.2+)
├── frontend/         → Application React 19 + pages publiques EC03
│   └── public/ec03/  → Interface publique statique (accueil, formations, dashboard)
├── skillhub.sql      → Dump de la base de données MySQL
├── openapi.yaml      → Documentation OpenAPI / Swagger
└── README.md
```

---

## Prérequis

| Outil               | Version minimale |
| ------------------- | ---------------- |
| PHP                 | 8.2              |
| Composer            | 2.x              |
| Node.js             | 18+              |
| MySQL / MariaDB     | 10.4+            |
| (Optionnel) MongoDB | 6+               |

---

## Installation

### 1. Base de données

```sql
-- Dans phpMyAdmin ou MySQL CLI :
CREATE DATABASE skillhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Importer le dump :
mysql -u root skillhub < skillhub.sql
```

### 2. Backend (API Laravel)

```bash
cd backend

# Installer les dépendances PHP
composer install

# Copier la configuration
cp .env.example .env   # ou utiliser le .env déjà présent

# Générer la clé d'application
php artisan key:generate

# Éditer backend/.env si nécessaire :
# DB_DATABASE=skillhub
# DB_USERNAME=root
# DB_PASSWORD=

# Migrations + seeders
php artisan migrate --seed

# Démarrer le serveur API
php artisan serve --host=127.0.0.1 --port=8000
```

L'API est accessible sur **http://127.0.0.1:8000/api**

### 3. Frontend (React + EC03)

```bash
cd frontend

# Installer les dépendances JS
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application est accessible sur **http://localhost:5173** (ou 5174/5175 si le port est occupé).

---

## Pages et routes

### Interface publique (EC03 statique)

| URL                     | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `/`                     | Redirige vers la page d'accueil                            |
| `/ec03/index.html`      | Accueil SkillHub (hero, formations, témoignages)           |
| `/ec03/formations.html` | Catalogue des formations (filtres niveau, catégorie, prix) |

### Application React (EC04)

| Route                     | Description                        |
| ------------------------- | ---------------------------------- |
| `/connexion`              | Connexion (apprenant / formateur)  |
| `/inscription`            | Création de compte                 |
| `/formation/:id`          | Détail d'une formation             |
| `/dashboard/apprenant`    | Tableau de bord apprenant          |
| `/dashboard/formateur`    | Tableau de bord formateur          |
| `/modifier-formation/:id` | Modifier une formation (formateur) |
| `/apprendre/:id`          | Page de suivi / apprentissage      |

### API REST

| Méthode | Endpoint                           | Description                                      |
| ------- | ---------------------------------- | ------------------------------------------------ |
| GET     | `/api/formations`                  | Liste publique des formations                    |
| GET     | `/api/formations/{id}`             | Détail d'une formation                           |
| GET     | `/api/formations/{id}/modules`     | Modules d'une formation                          |
| POST    | `/api/register`                    | Inscription                                      |
| POST    | `/api/login`                       | Connexion → JWT                                  |
| GET     | `/api/profile`                     | Profil utilisateur (JWT requis)                  |
| POST    | `/api/logout`                      | Déconnexion                                      |
| POST    | `/api/formations`                  | Créer une formation (formateur)                  |
| PUT     | `/api/formations/{id}`             | Modifier une formation (formateur propriétaire)  |
| DELETE  | `/api/formations/{id}`             | Supprimer une formation (formateur propriétaire) |
| POST    | `/api/formations/{id}/inscription` | S'inscrire à une formation (apprenant)           |
| DELETE  | `/api/formations/{id}/inscription` | Se désinscrire                                   |
| GET     | `/api/apprenant/formations`        | Mes formations inscrites                         |

Documentation Swagger : **http://127.0.0.1:8000/api/documentation**

---

## Fonctionnalités

- **Authentification JWT** — HMAC SHA-256, blacklist des tokens révoqués
- **Rôles** — apprenant / formateur avec dashboards dédiés
- **Formations** — CRUD complet pour les formateurs, catalogue public filtrable
- **Modules** — minimum 3 modules obligatoires par formation, éditables
- **Inscriptions** — suivi par l'apprenant avec page d'apprentissage dédiée
- **Logs MongoDB** — activité loguée (création, modification, suppression, vues, inscriptions)
- **Interface publique** — accueil et catalogue EC03 intégrés, animés et reliés à l'API

---

## Tests

```bash
cd backend
php artisan test
```

19 tests Feature, 0 échec.

---

## Dépannage

**Port CORS refusé ?**  
Vérifier `backend/config/cors.php` — les origines `http://localhost:5173/5174/5175` sont incluses.

**MySQL non démarré ?**  
Lancer XAMPP → démarrer Apache + MySQL avant `php artisan serve`.

**Port Vite occupé ?**  
Vite bascule automatiquement sur 5174 puis 5175. L'API détecte `window.location.hostname`.

**vendor/ absent ?**  
Relancer `composer install` dans `backend/`.
