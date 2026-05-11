# Documentation Technique - SkillHub

## Table des matières

1. [Architecture générale](#architecture-générale)
2. [Stack technologique](#stack-technologique)
3. [Structure du projet](#structure-du-projet)
4. [Services backend](#services-backend)
5. [Frontend React](#frontend-react)
6. [Base de données et MongoDB](#base-de-données-et-mongodb)
7. [API REST](#api-rest)
8. [Authentification et sécurité](#authentification-et-sécurité)
9. [Instructions d'installation](#instructions-dinstallation)
10. [Déploiement et CI/CD](#déploiement-et-cicd)

---

## Architecture générale

SkillHub est une **plateforme de formation en ligne** basée sur une architecture **microservices** avec un frontend React moderne.

### Composants principaux :

- **Frontend** : Application React avec Vite
- **Microservices** : 3 services Laravel (Auth, Catalog, Inscription)
- **Base de données** : MySQL (Auth, Catalog, Inscription)
- **Conteneurisation** : Docker & Docker Compose

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      API Gateway / Routes                   │
└──┬──────────────────────┬───────────────────┬───────────────┘
   │                      │                   │
   ▼                      ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ Service Auth│    │Service Catalog│    │Service Insc. │
│  (Port 8000)│    │ (Port 8001)  │    │ (Port 8002) │
└──────┬──────┘    └──────┬───────┘    └──────┬───────┘
       │                  │                   │
       ▼                  ▼                   ▼
    MySQL DB 1        MySQL DB 2          MySQL DB 3
```

---

## Stack technologique

### Frontend

- **Framework** : React 18+
- **Bundler** : Vite
- **Styling** : CSS3 (moderne avec variables CSS)
- **Composants** : Composants fonctionnels avec hooks
- **Routing** : React Router v6+
- **HTTP Client** : Axios
- **Icônes** : FontAwesome

### Backend (Microservices)

- **Framework** : Laravel 11+
- **Language** : PHP 8.2+
- **Package Manager** : Composer
- **API** : REST
- **Cache** : Redis (optionnel)

### Base de données

- **SGBD** : MySQL 8.0+
- **ORM** : Eloquent (Laravel)
- **Migrations** : Artisan migrations

### DevOps

- **Conteneurisation** : Docker
- **Orchestration** : Docker Compose
- **Web Server** : Nginx
- **PHP Runtime** : FPM

---

## Structure du projet

```
skillhub-groupe-BC03/
├── frontend/                          # Application React
│   ├── src/
│   │   ├── components/               # Composants réutilisables
│   │   │   ├── Sidebar.jsx          # Menu latéral
│   │   │   ├── Topbar.jsx           # Barre supérieure
│   │   │   ├── AtelierCard.jsx      # Carte formation
│   │   │   └── ...
│   │   ├── pages/                    # Pages principales
│   │   │   ├── Accueil.jsx          # Accueil public
│   │   │   ├── Connexion.jsx        # Page login
│   │   │   ├── Apprenant.jsx        # Dashboard apprenant
│   │   │   ├── Formateur.jsx        # Dashboard formateur
│   │   │   ├── SuiviFormation.jsx   # Suivi d'une formation
│   │   │   └── ...
│   │   ├── services/                 # Services API
│   │   │   ├── api.js               # Config Axios
│   │   │   ├── authApi.js           # Endpoints auth
│   │   │   ├── formationsApi.js     # Endpoints formations
│   │   │   └── ...
│   │   ├── styles/                  # Fichiers CSS
│   │   ├── utils/                   # Utilitaires (security, etc)
│   │   ├── App.jsx                  # Point d'entrée React
│   │   └── main.jsx                 # Bootstrap
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── services/                          # Microservices Laravel
│   ├── auth/                         # Service Authentication
│   │   ├── app/
│   │   ├── routes/api.php            # Routes API
│   │   ├── bootstrap/
│   │   └── database/migrations/
│   ├── catalog/                      # Service Catalog/Formations
│   │   └── ...
│   └── inscription/                  # Service Inscriptions
│       └── ...
│
├── docker/                            # Configuration Docker
│   ├── mysql/                        # MySQL setup
│   └── nginx/                        # Nginx config
│
├── docker-compose.yml                # Orchestration
├── openapi.yaml                      # Documentation API (Swagger)
└── DOCUMENTATION_TECHNIQUE.md        # Ce fichier
```

---

## Services backend

### Service Authentication (Port 8000)

**Responsabilités** : Authentification, autorisation, gestion utilisateurs

**Endpoints principaux** :

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/verify` - Vérification session
- `GET /api/users/:id` - Profil utilisateur

**Base de données** : `skillhub_auth`
**Migrations** : Voir `skillhub_auth.sql`

### Service Catalog (Port 8001)

**Responsabilités** : Gestion des formations, catégories, niveaux

**Endpoints principaux** :

- `GET /api/formations` - Liste formations
- `GET /api/formations/:id` - Détail formation
- `POST /api/formations` - Créer formation
- `PUT /api/formations/:id` - Modifier formation
- `DELETE /api/formations/:id` - Supprimer formation

**Base de données** : `skillhub_catalog`
**Structure** : Formations, modules, catégories

### Service Inscription (Port 8002)

**Responsabilités** : Gestion des inscriptions d'apprenants

**Endpoints principaux** :

- `POST /api/inscriptions` - Inscrire apprenant
- `GET /api/inscriptions/user/:userId` - Inscriptions utilisateur
- `DELETE /api/inscriptions/:id` - Désinscrire

**Base de données** : `skillhub_enrollment`

---

## Frontend React

### Architecture des composants

**Composants de layout** :

- `Sidebar.jsx` - Navigation latérale
- `Topbar.jsx` - Barre d'en-tête
- `RouteProtegee.jsx` - Wrapper pour routes protégées

**Composants métier** :

- `AtelierCard.jsx` - Affiche une carte formation
- `Summary.jsx` - Résumé statistiques
- `Table.jsx` - Tableau générique

**Pages principales** :

- `Accueil.jsx` - Page d'accueil publique
- `Formations.jsx` - Catalogue formations
- `Apprenant.jsx` - Dashboard apprenant
- `Formateur.jsx` - Dashboard formateur
- `SuiviFormation.jsx` - Suivi détaillé formation
- `Connexion.jsx` - Page login
- `Inscription.jsx` - Page signup

### Services API

Tous les services API utilisent Axios avec configuration centralisée :

```javascript
// services/api.js
- Configuration base URL
- Interceptors pour sécurité
- Gestion des erreurs

// services/authApi.js
- login(), logout(), register()

// services/formationsApi.js
- listerFormations(), listerFormationsApprenant()
- creerFormation(), modifierFormation()

// services/inscriptionApi.js
- inscrireFormation(), desinscrireFormation()
```

### Styling

**Variables CSS globales** (définiesdans `index.css`) :

```css
--primary: #5b3df6 --primary-dark: #3a1e9a --primary-light: #edeaff
  --accent: #ffb347 --danger: #e05252 --success: #2ecc71 --background: #f7f8fc
  --surface: #ffffff --text-main: #232740 --text-muted: #6d7388
  --border: #e7e9f4 --shadow: 0 8px 24px rgba(52, 60, 98, 0.1);
```

---

## Base de données et MongoDB

### Schéma MySQL

#### Table users (Service Auth)

```sql
id, email, password, nom, prenom, role, created_at, updated_at
```

#### Table formations (Service Catalog)

```sql
id, titre, description, formateur_id, niveau, duree, categorie, prix, created_at, updated_at
```

#### Table modules (Service Catalog)

```sql
id, formation_id, titre, contenu, ordre, created_at, updated_at
```

#### Table inscriptions (Service Inscription)

```sql
id, user_id, formation_id, date_inscription, progression, status, created_at, updated_at
```

### Configuration MongoDB

Si MongoDB est utilisé pour les logs :

**Collections** :

- `activity_logs` - Journaux utilisateur
- `sessions` - Sessions temporaires
- `analytics` - Données analytiques

---

## API REST

### Authentication Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/verify
PUT    /api/auth/password
```

### Formations Endpoints

```
GET    /api/formations
GET    /api/formations/:id
POST   /api/formations
PUT    /api/formations/:id
DELETE /api/formations/:id
GET    /api/formations/:id/modules
```

### Inscriptions Endpoints

```
POST   /api/inscriptions
GET    /api/inscriptions/user/:userId
GET    /api/inscriptions/:id
PUT    /api/inscriptions/:id
DELETE /api/inscriptions/:id
```

### Réponse standard

```json
{
  "success": true,
  "data": { ... },
  "message": "Action réussie",
  "errors": null
}
```

---

## Authentification et sécurité

### Mécanismes de sécurité

1. **JWT (JSON Web Tokens)** - Stocké en localStorage
2. **HTTPS** - Recommandé en production
3. **HMAC-SHA256** - Signature des requêtes
4. **Headers de sécurité** :
   - `X-Timestamp` - Timestamp du serveur
   - `X-Nonce` - Valeur aléatoire
   - `X-HMAC-Signature` - Signature requête

### Flux d'authentification

```
1. Utilisateur soumet login/register
2. Backend valide et crée JWT
3. Frontend stocke JWT en localStorage
4. Chaque requête inclut JWT en Authorization header
5. Backend valide JWT avant accès ressource
```

### Rôles et permissions

- **Public** : Pas connecté
- **Apprenant** : Suivi formations
- **Formateur** : Création/modification formations

---

## Instructions d'installation

### Prérequis

- Node.js 18+
- PHP 8.2+
- Composer
- Docker & Docker Compose
- MySQL 8.0+

### Installation locale

#### 1. Cloner et structure

```bash
git clone https://github.com/Andrimirana/skillhub-groupe-BC03.git
cd skillhub-groupe-BC03
```

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev  # Vite dev server port 5173
```

#### 3. Services backend

```bash
# Service Auth
cd services/auth
composer install
php artisan serve --port=8000

# Service Catalog (autre terminal)
cd services/catalog
composer install
php artisan serve --port=8001

# Service Inscription (autre terminal)
cd services/inscription
composer install
php artisan serve --port=8002
```

#### 4. Base de données

```bash
# Importer les fichiers SQL
mysql -u root -p < skillhub_auth.sql
mysql -u root -p < skillhub_catalog.sql
mysql -u root -p < skillhub_enrollment.sql
```

### Installation avec Docker

```bash
docker-compose up -d
# Frontend: http://localhost:5173
# Services: http://localhost:8000, 8001, 8002
```

---

## Déploiement et CI/CD

### Outils

- **CI/CD** : GitHub Actions (`.github/workflows/`)
- **Registre Docker** : Docker Hub

### Pipeline

```
1. Push code → GitHub
2. Tests unitaires & lint
3. Build Docker images
4. Push to registry
5. Deploy staging/production
```

### Variables d'environnement requises

**Frontend** (`.env.local`) :

```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_MASTER_KEY=your_secret_key
```

**Backend** (`.env`) :

```
APP_NAME=SkillHub
DB_HOST=localhost
DB_DATABASE=skillhub_auth
DB_USERNAME=root
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret
```

---

## Fichiers clés à connaître

| Fichier                        | Rôle                      |
| ------------------------------ | ------------------------- |
| `docker-compose.yml`           | Orchestration conteneurs  |
| `frontend/src/App.jsx`         | Routage React             |
| `frontend/src/services/api.js` | Config HTTP               |
| `services/*/routes/api.php`    | Routes Laravel            |
| `DOCUMENTATION_TECHNIQUE.md`   | Ce fichier                |
| `openapi.yaml`                 | Documentation Swagger API |

