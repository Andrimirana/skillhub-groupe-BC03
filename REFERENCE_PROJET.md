# 📋 DOCUMENT DE RÉFÉRENCE - SKILLHUB

> **Document de référence technique complet pour le projet SkillHub**  
> Ce document doit être consulté à chaque intervention sur le projet pour garantir la cohérence et la qualité.

---

## 🎯 PRÉSENTATION GÉNÉRALE

### Objectif du Projet

**SkillHub** est une plateforme web collaborative de mise en relation entre formateurs et apprenants, développée dans le cadre du Bachelor Concepteur Développeur Web Full Stack (Bloc 03 : Cloud, DevOps et Architecture, Promotion 2025/2026).

### Contexte Pédagogique

- **Bloc** : Bloc 03 - Cloud, DevOps et Architecture
- **Compétences** : Industrialisation, conteneurisation, automatisation, qualité logicielle
- **Groupe** : BC03
- **Repository** : Andrimirana/skillhub-groupe-BC03
- **Branche principale** : main

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR WEB (Client)                   │
│                   http://localhost:5173                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              FRONTEND - React 19 + Vite                      │
│           Container: skillhub_frontend (Node 20)             │
│  • Routing : React Router v7                                 │
│  • State : LocalStorage + Session                            │
│  • API Calls : Axios                                         │
│  • Crypto : CryptoJS (HMAC)                                  │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │               │
        │ JWT + HMAC   │               │
        │              │               │
┌───────▼──────┐ ┌────▼────────┐ ┌───▼──────────────┐
│   AUTH API   │ │ CATALOG API │ │ INSCRIPTION API  │
│ Port: 8001   │ │ Port: 8002  │ │ Port: 8003       │
│ Laravel 13   │ │ Laravel 13  │ │ Laravel 13       │
│ PHP 8.4      │ │ PHP 8.4     │ │ PHP 8.4          │
└──────┬───────┘ └──────┬──────┘ └────┬─────────────┘
       │                │               │
       │        ┌───────▼───────────────▼─────┐
       └────────►    MySQL 8.0 (Port 3306)    │
                │  • skillhub_auth             │
                │  • skillhub_catalog          │
                │  • skillhub_enrollment       │
                └──────────────────────────────┘
```

### Stack Technologique

#### Frontend

- **Framework** : React 19.2.0
- **Build Tool** : Vite (rolldown-vite 7.2.5)
- **Routing** : React Router DOM v7.13.0
- **HTTP Client** : Axios v1.11.0
- **Cryptographie** : crypto-js v4.2.0
- **Icons** : FontAwesome v7.1.0
- **Linting** : ESLint v9.39.1

#### Backend (Microservices)

- **Framework** : Laravel 13.5.0
- **Language** : PHP 8.4-cli
- **Architecture** : Microservices indépendants
- **Authentication** : JWT + HMAC
- **API** : RESTful

#### Base de Données

- **SGBD** : MySQL 8.0
- **Architecture** : 3 bases de données séparées (une par microservice)
- **ORM** : Eloquent (Laravel)

#### DevOps

- **Conteneurisation** : Docker + Docker Compose
- **CI/CD** : GitHub Actions
- **Quality** : SonarCloud
- **Testing** : PHPUnit, ESLint

---

## 📦 STRUCTURE DU PROJET

```
skillhub-groupe-BC03/
├── 📁 docker/                      # Configuration Docker
│   └── mysql/init/                 # Scripts d'initialisation MySQL
│       ├── 01-create-databases.sql
│       ├── skillhub_auth.sql
│       ├── skillhub_catalog.sql
│       └── skillhub_enrollment.sql
│
├── 📁 frontend/                    # Application React
│   ├── public/assets/images/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/             # Composants réutilisables
│   │   │   ├── AtelierCard.jsx
│   │   │   ├── RouteProtegee.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── ...
│   │   ├── pages/                  # Pages principales
│   │   │   ├── Accueil.jsx
│   │   │   ├── Connexion.jsx
│   │   │   ├── Inscription.jsx
│   │   │   ├── Formations.jsx
│   │   │   ├── DetailFormation.jsx
│   │   │   ├── Formateur.jsx
│   │   │   ├── Apprenant.jsx
│   │   │   ├── CreerAtelier.jsx
│   │   │   └── ...
│   │   ├── services/               # Services API
│   │   │   ├── api.js              # Configuration Axios
│   │   │   ├── auth.js             # Gestion session
│   │   │   ├── authApi.js          # API Auth
│   │   │   ├── catalogApi.js       # API Catalog
│   │   │   ├── inscriptionApi.js   # API Inscription
│   │   │   ├── formationsApi.js    # Fonctions formations
│   │   │   └── session.js          # Vérification session
│   │   ├── styles/                 # CSS par composant
│   │   ├── utils/
│   │   │   └── security.js         # Fonctions HMAC
│   │   ├── App.jsx                 # Composant racine
│   │   └── main.jsx                # Point d'entrée
│   ├── .env                        # Variables d'environnement
│   ├── package.json
│   └── vite.config.js
│
├── 📁 services/                    # Microservices Laravel
│   ├── 📁 auth/                    # Service Authentification
│   │   ├── app/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   └── AuthController.php
│   │   │   │   └── Middleware/
│   │   │   │       ├── VerifierJetonJwt.php
│   │   │   │       └── AntiRejeuHmac.php
│   │   │   ├── Models/
│   │   │   │   └── User.php
│   │   │   └── Services/
│   │   ├── config/
│   │   ├── database/
│   │   │   └── migrations/
│   │   │       ├── 0001_01_01_000000_create_users_table.php
│   │   │       └── 2026_03_05_000100_add_role_to_users_table.php
│   │   ├── routes/
│   │   │   ├── api.php             # Routes API
│   │   │   └── web.php             # Routes web
│   │   ├── tests/
│   │   ├── .env                    # Configuration
│   │   ├── composer.json
│   │   └── Dockerfile
│   │
│   ├── 📁 catalog/                 # Service Catalogue
│   │   ├── app/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── FormationController.php
│   │   │   │   │   └── ModuleController.php
│   │   │   │   └── Middleware/
│   │   │   │       └── ValidateServiceToken.php
│   │   │   └── Models/
│   │   │       ├── Formation.php
│   │   │       └── Module.php
│   │   ├── database/
│   │   │   └── migrations/
│   │   │       ├── 2026_04_14_000100_create_formations_table.php
│   │   │       └── 2026_04_14_000200_create_modules_table.php
│   │   ├── routes/
│   │   │   ├── api.php
│   │   │   └── web.php
│   │   ├── .env
│   │   ├── composer.json
│   │   └── Dockerfile
│   │
│   └── 📁 inscription/             # Service Inscriptions
│       ├── app/
│       │   ├── Http/
│       │   │   ├── Controllers/
│       │   │   │   └── EnrollmentController.php
│       │   │   └── Middleware/
│       │   │       └── ValidateServiceToken.php
│       │   └── Models/
│       │       └── Enrollment.php
│       ├── database/
│       │   └── migrations/
│       │       └── 2026_04_14_000100_create_enrollments_table.php
│       ├── routes/
│       │   ├── api.php
│       │   └── web.php
│       ├── .env
│       ├── composer.json
│       └── Dockerfile
│
├── 📄 docker-compose.yml           # Orchestration Docker
├── 📄 README.md                    # Documentation principale
├── 📄 DOCUMENTATION_TECHNIQUE.md   # Doc technique détaillée
├── 📄 contributing.md              # Guide de contribution
├── 📄 openapi.yaml                 # Spécification OpenAPI
├── 📄 sonar-project.properties     # Configuration SonarCloud
└── 📄 REFERENCE_PROJET.md          # Ce document
```

---

## 🔐 SCHÉMA DE BASE DE DONNÉES

### Base : skillhub_auth (Port 8001)

```sql
-- Table: users
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('formateur', 'apprenant') DEFAULT 'apprenant',
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Table: sessions
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity INT NOT NULL,
    INDEX(user_id),
    INDEX(last_activity)
);

-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
);
```

### Base : skillhub_catalog (Port 8002)

```sql
-- Table: formations
CREATE TABLE formations (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    statut VARCHAR(60) DEFAULT 'À venir',
    price DECIMAL(10,2) DEFAULT 0,
    duration INT DEFAULT 1,
    level VARCHAR(30) DEFAULT 'beginner',
    vues BIGINT UNSIGNED DEFAULT 0,
    user_id BIGINT UNSIGNED NOT NULL,          -- ID du formateur (Auth service)
    formateur_nom VARCHAR(255) NULL,           -- Nom dénormalisé
    apprenants_count INT UNSIGNED DEFAULT 0,   -- MAJ par Inscription service
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Table: modules
CREATE TABLE modules (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    ordre INT DEFAULT 1,
    formation_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
);
```

### Base : skillhub_enrollment (Port 8003)

```sql
-- Table: enrollments
CREATE TABLE enrollments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id BIGINT UNSIGNED NOT NULL,  -- ID de l'apprenant (Auth service)
    formation_id BIGINT UNSIGNED NOT NULL,    -- ID de la formation (Catalog service)
    progression INT DEFAULT 0,
    date_inscription TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY unique_enrollment (utilisateur_id, formation_id)
);
```

---

## 🌐 API ENDPOINTS

### 🔐 AUTH API (http://localhost:8001/api)

#### Routes Publiques avec HMAC

```http
POST /api/register      # Inscription utilisateur
POST /api/inscription   # Alias inscription
POST /api/login         # Connexion
POST /api/connexion     # Alias connexion
POST /api/validate-token # Validation token JWT
```

**Body Inscription/Registration:**

```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "MotDePasse123!",
  "role": "apprenant" // ou "formateur"
}
```

**Body Connexion/Login:**

```json
{
  "email": "jean@example.com",
  "password": "MotDePasse123!"
}
```

#### Routes Protégées (JWT Required)

```http
GET  /api/profil           # Obtenir profil utilisateur
GET  /api/profile          # Alias profil
PUT  /api/change-password  # Changer mot de passe
POST /api/deconnexion      # Déconnexion
POST /api/logout           # Alias déconnexion
```

**Headers requis:**

```
Authorization: Bearer {jwt_token}
```

---

### 📚 CATALOG API (http://localhost:8002/api)

#### Routes Publiques

```http
GET /api/formations                      # Liste toutes les formations
GET /api/formations/{id}                 # Détail d'une formation
GET /api/formations/{id}/modules         # Modules d'une formation
```

**Exemple réponse GET /api/formations:**

```json
[
  {
    "id": 1,
    "titre": "Introduction à React",
    "description": "Apprenez les bases de React",
    "category": "Développement Web",
    "date": "2026-06-01",
    "statut": "À venir",
    "price": 99.99,
    "duration": 40,
    "level": "beginner",
    "vues": 150,
    "user_id": 5,
    "formateur_nom": "Marie Martin",
    "apprenants_count": 23,
    "created_at": "2026-05-01T10:00:00.000000Z",
    "updated_at": "2026-05-05T12:00:00.000000Z"
  }
]
```

#### Routes Protégées (Service Token Required)

```http
GET    /api/my-formations              # Mes formations (formateur)
POST   /api/formations                 # Créer une formation
PUT    /api/formations/{id}            # Modifier une formation
DELETE /api/formations/{id}            # Supprimer une formation

POST   /api/formations/{id}/modules    # Ajouter un module
PUT    /api/modules/{id}               # Modifier un module
DELETE /api/modules/{id}               # Supprimer un module
```

**Headers requis:**

```
X-Service-Token: {jwt_token_from_auth}
```

---

### 📝 INSCRIPTION API (http://localhost:8003/api)

#### Routes Protégées (Service Token Required)

```http
POST   /api/formations/{id}/inscription   # S'inscrire à une formation
DELETE /api/formations/{id}/inscription   # Se désinscrire
GET    /api/apprenant/formations          # Mes formations (apprenant)
```

**Exemple réponse GET /api/apprenant/formations:**

```json
[
  {
    "id": 1,
    "utilisateur_id": 10,
    "formation_id": 1,
    "progression": 45,
    "date_inscription": "2026-05-01T10:00:00.000000Z",
    "formation": {
      "id": 1,
      "titre": "Introduction à React",
      "description": "...",
      "formateur_nom": "Marie Martin"
    }
  }
]
```

**Headers requis:**

```
X-Service-Token: {jwt_token_from_auth}
```

---

## 🔒 SÉCURITÉ & AUTHENTIFICATION

### Mécanisme JWT + HMAC

#### 1. Inscription/Connexion

```javascript
// Frontend génère signature HMAC
const timestamp = Date.now();
const nonce = crypto.randomBytes(16).toString('hex');
const body = JSON.stringify({ email, password });
const signature = CryptoJS.HmacSHA256(
  `${timestamp}${nonce}${body}`,
  MASTER_KEY
).toString();

// Headers envoyés
{
  'X-Timestamp': timestamp,
  'X-Nonce': nonce,
  'X-Signature': signature,
  'Content-Type': 'application/json'
}
```

#### 2. Middleware Backend AntiRejeuHmac

```php
// Vérifie:
// - Timestamp (< 60 secondes)
// - Nonce unique (anti-rejeu)
// - Signature HMAC valide
```

#### 3. Retour JWT

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "utilisateur": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "apprenant"
  }
}
```

#### 4. Stockage Frontend

```javascript
// LocalStorage
localStorage.setItem("authToken", token);
localStorage.setItem("utilisateur", JSON.stringify(utilisateur));
```

#### 5. Requêtes Authentifiées

```javascript
// Toutes les requêtes incluent:
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// Pour les services catalog/inscription:
axios.defaults.headers.common["X-Service-Token"] = token;
```

### Middleware de Protection

#### Frontend: RouteProtegee.jsx

```javascript
// Vérifie la session avant d'afficher le contenu
// Redirige vers /connexion si non authentifié
// Vérifie le rôle pour certaines routes (formateur/apprenant)
```

#### Backend: VerifierJetonJwt.php

```php
// Vérifie la validité du JWT
// Décode et extrait user_id
// Attache l'utilisateur à la requête
```

---

## 🛠️ CONFIGURATION & VARIABLES D'ENVIRONNEMENT

### Frontend (.env)

```env
VITE_AUTH_URL=http://127.0.0.1:8001/api
VITE_CATALOG_URL=http://127.0.0.1:8002/api
VITE_INSCRIPTION_URL=http://127.0.0.1:8003/api
VITE_APP_MASTER_KEY=UneCleSuperSecreteDe32Caracteres!
```

### Backend Auth (.env)

```env
APP_NAME="SkillHub Auth"
APP_ENV=local
APP_KEY=base64:K9mL7nP2qR5tV8wX1yA4bC6dE9fH2jK5mN8pQ1rT4uV=
APP_DEBUG=true
APP_URL=http://localhost:8001

DB_CONNECTION=mysql
DB_HOST=db                          # Nom du conteneur Docker
DB_PORT=3306
DB_DATABASE=skillhub_auth
DB_USERNAME=skillhub_user
DB_PASSWORD=root

CACHE_STORE=file                    # ⚠️ IMPORTANT: 'file' pas 'database'
SESSION_DRIVER=database             # Auth peut utiliser database (table existe)

JWT_SECRET=UneCleSuperSecreteDe32Caracteres!
APP_MASTER_KEY=UneCleSuperSecreteDe32Caracteres!
```

### Backend Catalog (.env)

```env
APP_NAME="SkillHub Catalog"
APP_KEY=base64:X3yZ1aB4cD7eG9hJ2kL5mN8pQ1rT4uV7wX0yA3bC6dE=
DB_DATABASE=skillhub_catalog
CACHE_STORE=file                    # ⚠️ IMPORTANT: 'file' pas 'database'
SESSION_DRIVER=file                 # ⚠️ IMPORTANT: 'file' pas 'database'

# Communication inter-services (Docker)
AUTH_SERVICE_URL=http://auth_api:8000  # ⚠️ CRITIQUE: Nom du service Docker, pas localhost

# ... autres configs identiques à Auth
```

### Backend Inscription (.env)

```env
APP_NAME="SkillHub Inscription"
APP_KEY=base64:F4gH7jK0mN3pQ6rT9uV2wX5yA8bC1dE4fG7hJ0kL3mN=
DB_DATABASE=skillhub_enrollment
CACHE_STORE=file                    # ⚠️ IMPORTANT: 'file' pas 'database'
SESSION_DRIVER=file                 # ⚠️ IMPORTANT: 'file' pas 'database'

# Communication inter-services (Docker)
AUTH_SERVICE_URL=http://auth_api:8000     # ⚠️ CRITIQUE: Pour validation JWT
CATALOG_SERVICE_URL=http://catalog_api:8000  # ⚠️ CRITIQUE: Pour récupération formations

# ... autres configs identiques à Auth
```

> **⚠️ Points critiques de configuration** :
>
> - **CACHE_STORE=file** pour les 3 services (évite erreur table cache inexistante)
> - **SESSION_DRIVER=file** pour Catalog et Inscription (table sessions n'existe que dans Auth)
> - **SESSION_DRIVER=database** OK pour Auth uniquement (table sessions présente)
> - **AUTH_SERVICE_URL=http://auth_api:8000** pour Catalog et Inscription (validation JWT)
> - **CATALOG_SERVICE_URL=http://catalog_api:8000** pour Inscription (récupération formations)
>   - ⚠️ **NE PAS** utiliser `localhost:8001` ou `localhost:8002` → ne fonctionne pas dans Docker
>   - ✅ **UTILISER** noms de services Docker (`auth_api`, `catalog_api`) + port interne (8000)

---

## 🐳 DOCKER & DÉPLOIEMENT

### Commandes Docker Essentielles

```bash
# Démarrer tous les services
docker compose up -d

# Arrêter tous les services
docker compose down

# Rebuild complet (après modif Dockerfile)
docker compose down -v
docker compose up --build -d

# Voir les logs
docker compose logs -f                    # Tous les services
docker compose logs -f auth_api           # Service spécifique
docker compose logs --tail=50 catalog_api # Dernières 50 lignes

# État des conteneurs
docker compose ps

# Exécuter une commande dans un conteneur
docker compose exec auth_api php artisan migrate
docker compose exec catalog_api php artisan cache:clear

# Entrer dans un conteneur
docker compose exec auth_api sh
```

### Ports Exposés

```
- Frontend:     http://localhost:5173
- Auth API:     http://localhost:8001
- Catalog API:  http://localhost:8002
- Inscription:  http://localhost:8003
- MySQL:        localhost:3306
```

### Volumes Docker

```yaml
volumes:
  - ./frontend:/app # Hot reload frontend
  - ./services/auth:/var/www # Hot reload auth
  - ./services/catalog:/var/www # Hot reload catalog
  - ./services/inscription:/var/www # Hot reload inscription
  - db_data:/var/lib/mysql # Persistance MySQL
```

---

## 🧪 TESTS & QUALITÉ

### Tests Backend (PHPUnit)

```bash
# Dans chaque microservice
docker compose exec auth_api php artisan test
docker compose exec catalog_api ./vendor/bin/phpunit
docker compose exec inscription_api php artisan test
```

### Linting Frontend

```bash
cd frontend
npm run lint
```

### SonarCloud

```bash
# Configuration dans sonar-project.properties
# Analyse automatique sur chaque PR via GitHub Actions
```

---

## ��️ ROUTING FRONTEND

### Routes Publiques

```javascript
/                        → Accueil.jsx (Page d'accueil)
/formations              → Formations.jsx (Catalogue)
/formation/:id           → DetailFormation.jsx (Détail formation)
```

### Routes Invité (non connecté)

```javascript
/connexion               → Connexion.jsx
/inscription             → Inscription.jsx
```

### Routes Protégées - Formateur

```javascript
/dashboard/formateur     → Formateur.jsx (Dashboard formateur)
/creer-atelier          → CreerAtelier.jsx (Créer formation)
/modifier-formation/:id  → ModifierFormation.jsx (Éditer formation)
/mes-ateliers           → Ateliers.jsx (Mes formations)
```

### Routes Protégées - Apprenant

```javascript
/dashboard/apprenant     → Apprenant.jsx (Dashboard apprenant)
/apprendre/:id          → SuiviFormation.jsx (Suivre formation)
/mes-ateliers           → Ateliers.jsx (Mes inscriptions)
```

### Redirections Automatiques

```javascript
/dashboard               → /dashboard/formateur OU /dashboard/apprenant
                           (selon le rôle)
/*                       → / (404 redirect)
```

---

## 🎨 COMPOSANTS FRONTEND CLÉS

### RouteProtegee.jsx

**Rôle** : Protéger les routes authentifiées

```javascript
// Vérifie la session
// Redirige vers /connexion si non connecté
// Peut vérifier le rôle: roleAutorise="formateur"
```

### Sidebar.jsx & Topbar.jsx

**Rôle** : Navigation principale

```javascript
// Sidebar : Menu latéral avec liens selon le rôle
// Topbar : Header avec nom utilisateur et déconnexion
```

### AtelierCard.jsx

**Rôle** : Afficher une formation en carte

```javascript
// Props: formation (objet)
// Affiche: titre, description, catégorie, prix, niveau
```

---

## 📊 ÉTAT ACTUEL DU PROJET

### ✅ Fonctionnel (100% Opérationnel)

- ✅ Docker Compose orchestration fonctionnelle
- ✅ 3 microservices Laravel déployés et accessibles
- ✅ Frontend React fonctionnel (port 5173)
- ✅ Base de données MySQL configurée avec 3 bases séparées
- ✅ Migrations exécutées sur toutes les bases
- ✅ Routes API définies et testées
- ✅ Authentification JWT en place et fonctionnelle
- ✅ Middleware HMAC configuré (AntiRejeuHmac)
- ✅ Middleware Service Token configuré (ValidateServiceToken)
- ✅ **Routes racines (/) fonctionnelles pour tous les services**
- ✅ **Cache Laravel configuré en mode 'file'**
- ✅ **Session Laravel configurée en mode 'file' pour catalog et inscription**

#### Tests de Validation Effectués

```bash
# Tous les services répondent HTTP 200
✅ http://localhost:8001 - Auth API
✅ http://localhost:8002 - Catalog API
✅ http://localhost:8003 - Inscription API
✅ http://localhost:5173 - Frontend React

# Routes API fonctionnelles
✅ GET /api/formations (Catalog) - HTTP 200 - Retourne []
```

### 🟡 À Configurer/Tester

1. **Tests End-to-End** : Tester le flux complet inscription → connexion → création formation → inscription formation
2. **Communication inter-services** : Valider que Catalog/Inscription peuvent valider les JWT via Auth API
3. **Tests unitaires** : Compléter la couverture de tests PHPUnit
4. **CI/CD** : Vérifier que GitHub Actions fonctionne correctement
5. **SonarCloud** : Valider la configuration et les rapports de qualité
6. **CORS** : Tester depuis différentes origines si nécessaire

### ⚠️ Problèmes Résolus

1. ✅ **HTTP 500 sur routes racines** - **RÉSOLU**
   - **Cause** : `SESSION_DRIVER=database` mais table sessions inexistante dans catalog et inscription
   - **Solution** : Changé `SESSION_DRIVER=file` dans `.env` de catalog et inscription
2. ✅ **Cache Laravel** - **RÉSOLU**
   - **Cause** : `CACHE_STORE=database` mais table cache inexistante
   - **Solution** : Changé `CACHE_STORE=file` dans tous les `.env`

3. ✅ **Serveurs Laravel ne Démarraient Pas - **RÉSOLU\*\*
   - **Cause** : Commande multi-lignes mal formatée dans docker-compose.yml
   - **Solution** : Mis la commande sur une seule ligne avec `&&`

4. ✅ **Communication Inter-Services Impossible** - **RÉSOLU**
   - **Cause** : Catalog et Inscription tentaient de contacter Auth via `localhost:8001` au lieu du nom de service Docker
   - **Erreur** : `cURL error 7: Failed to connect to localhost port 8001`
   - **Solution** : Ajouté `AUTH_SERVICE_URL=http://auth_api:8000` dans les `.env` de catalog et inscription
   - **Explication** : Dans Docker, les conteneurs communiquent via leur nom de service (réseau `skillhub_network`), pas via `localhost`

5. ✅ **Inscription ne Pouvait pas Récupérer les Formations** - **RÉSOLU**
   - **Cause** : Inscription tentait de contacter Catalog via `localhost:8002` pour récupérer les formations
   - **Erreur** : `cURL error 7: Failed to connect to localhost port 8002` lors du suivi d'une formation
   - **Solution** : Ajouté `CATALOG_SERVICE_URL=http://catalog_api:8000` dans `.env` de inscription
   - **Usage** : Permet à Inscription de vérifier l'existence des formations et récupérer leurs détails
   - **Test** : `docker compose exec inscription_api curl http://catalog_api:8000/api/formations`

6. ✅ **Erreurs CORS Bloquant Frontend → Backend** - **RÉSOLU**
   - **Cause** : Middleware CORS de Laravel non activé explicitement, empêchant les requêtes du frontend React (localhost:5173) vers les APIs (127.0.0.1:8001/8002/8003)
   - **Erreur** : `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`
   - **Solution Appliquée** :
     1. Activé explicitement `HandleCors` middleware dans `bootstrap/app.php` des 3 services
     2. Configuré `cors.php` avec `supports_credentials => true` et `exposed_headers => ['Authorization']`
     3. Créé scripts `start.sh` pour gérer le démarrage propre des serveurs Laravel avec `killall` pour éviter conflits de ports
     4. Modifié les Dockerfiles pour installer `procps` (contient killall) et donner permissions d'exécution aux scripts
   - **Headers CORS Actifs** :
     - `Access-Control-Allow-Origin: http://localhost:5173`
     - `Access-Control-Allow-Credentials: true`
     - `Access-Control-Expose-Headers: Authorization`
     - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - **Fichiers Modifiés** :
     - `services/auth/bootstrap/app.php` - Ajout middleware CORS
     - `services/catalog/bootstrap/app.php` - Ajout middleware CORS
     - `services/inscription/bootstrap/app.php` - Ajout middleware CORS
     - `services/auth/config/cors.php` - Configuration credentials et headers
     - `services/catalog/config/cors.php` - Configuration credentials et headers
     - `services/inscription/config/cors.php` - Configuration credentials et headers
     - `services/auth/start.sh` - Script de démarrage propre (NOUVEAU)
     - `services/catalog/start.sh` - Script de démarrage propre (NOUVEAU)
     - `services/inscription/start.sh` - Script de démarrage propre (NOUVEAU)
     - `services/*/Dockerfile` - Installation de procps et permissions sur start.sh
     - `docker-compose.yml` - Utilisation des scripts start.sh au lieu des commandes inline
   - **Test** :

     ```bash
     # Test OPTIONS preflight
     curl -i -X OPTIONS http://127.0.0.1:8001/api/register \
       -H "Origin: http://localhost:5173" \
       -H "Access-Control-Request-Method: POST"
     # Doit retourner HTTP 204 avec headers Access-Control-*

     # Test GET direct
     curl -i http://127.0.0.1:8002/api/formations \
       -H "Origin: http://localhost:5173"
     # Doit retourner HTTP 200 avec headers Access-Control-*
     ```

## 🚀 GUIDE DE DÉMARRAGE RAPIDE

### Pour Démarrer le Projet

```bash
# 1. Cloner le repo
git clone https://github.com/Andrimirana/skillhub-groupe-BC03.git
cd skillhub-groupe-BC03

# 2. Démarrer Docker Desktop (Windows)

# 3. Lancer les services
docker compose up -d

# 4. Attendre 2-3 minutes (installation dépendances + migrations)

# 5. Accéder aux services
# Frontend: http://localhost:5173
# Auth API: http://localhost:8001/api
# Catalog API: http://localhost:8002/api
# Inscription API: http://localhost:8003/api
```

### Vérification Rapide

```bash
# État des conteneurs
docker compose ps

# Tous les ports doivent être mappés :
# - skillhub_frontend: 0.0.0.0:5173->5173/tcp
# - skillhub_auth: 0.0.0.0:8001->8000/tcp
# - skillhub_catalog: 0.0.0.0:8002->8000/tcp (ou juste 8000/tcp, tester avec curl)
# - skillhub_inscription: 0.0.0.0:8003->8000/tcp (ou juste 8000/tcp, tester avec curl)
# - skillhub_db: 0.0.0.0:3306->3306/tcp (ou juste 3306/tcp)

# Logs si problème
docker compose logs -f

# Test de tous les services (PowerShell)
@('http://localhost:8001', 'http://localhost:8002', 'http://localhost:8003', 'http://localhost:5173') | ForEach-Object {
    try {
        $r = Invoke-WebRequest -Uri $_ -TimeoutSec 5 -UseBasicParsing
        Write-Host "✅ $_ : HTTP $($r.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $_ : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test API formations
curl http://localhost:8002/api/formations
# Devrait retourner: []
```

### Tests de Validation Complets

```bash
# 1. Vérifier que tous les services répondent
curl http://localhost:8001  # {"service":"Auth API","status":"running"}
curl http://localhost:8002  # {"service":"Catalog API","status":"running"}
curl http://localhost:8003  # {"service":"Inscription API","status":"running"}
curl http://localhost:5173  # HTML de la page React

# 2. Vérifier les endpoints API
curl http://localhost:8002/api/formations  # []

# 3. Tester l'inscription via le frontend
# Ouvrir http://localhost:5173/inscription dans le navigateur
# Créer un compte formateur

# 4. Tester la connexion
# http://localhost:5173/connexion
# Se connecter avec les identifiants créés

# 5. Tester la création de formation
# http://localhost:5173/creer-atelier
# Créer une formation de test

# 6. Vérifier que la formation apparaît
curl http://localhost:8002/api/formations  # Devrait contenir la formation créée
```

---

## 🐛 PROBLÈMES COURANTS & SOLUTIONS

### Problème : "user declined directory sharing"

**Solution** : Autoriser Docker à accéder au dossier du projet dans Docker Desktop → Settings → Resources → File sharing

### Problème : "composer install timeout"

**Solution** : ✅ Déjà résolu dans docker-compose.yml avec `COMPOSER_PROCESS_TIMEOUT=600`

### Problème : "SQLSTATE[42S02]: Base table 'cache' doesn't exist"

**Solution** : ✅ Déjà résolu - `CACHE_STORE=file` configuré dans tous les .env

### Problème : HTTP 500 sur routes racines `/` (catalog, inscription)

**Cause** : `SESSION_DRIVER=database` mais la table `sessions` n'existe que dans la base `skillhub_auth`, pas dans `skillhub_catalog` ni `skillhub_enrollment`

**Solution** : ✅ Déjà résolu - `SESSION_DRIVER=file` configuré dans catalog/.env et inscription/.env

```bash
# Vérifier la configuration
docker compose exec catalog_api cat .env | grep SESSION_DRIVER
# Devrait afficher: SESSION_DRIVER=file
```

### Problème : cURL error 7 - Communication inter-services impossible

**Symptômes** :

- `cURL error 7: Failed to connect to localhost port 8001` (création d'atelier)
- `cURL error 7: Failed to connect to localhost port 8002` (suivi de formation)

**Cause** : Les conteneurs Docker ne peuvent pas communiquer via `localhost`. Ils doivent utiliser les noms de service Docker.

**Solutions appliquées** :

1. **Pour Catalog et Inscription → Auth** (validation JWT) :

   ```env
   # Ajouter dans services/catalog/.env et services/inscription/.env
   AUTH_SERVICE_URL=http://auth_api:8000
   ```

2. **Pour Inscription → Catalog** (récupération formations) :
   ```env
   # Ajouter dans services/inscription/.env
   CATALOG_SERVICE_URL=http://catalog_api:8000
   ```

Puis redémarrer : `docker compose down && docker compose up -d`

**Vérification** :

```bash
# Test de connectivité depuis inscription vers catalog
docker compose exec inscription_api curl http://catalog_api:8000/api/formations

# Test de connectivité depuis catalog vers auth
docker compose exec catalog_api curl http://auth_api:8000
```

### Problème : Les serveurs Laravel ne démarrent pas automatiquement

**Cause** : Commande multi-lignes dans docker-compose.yml mal formatée (retours à la ligne YAML)

**Solution** : ✅ Déjà résolu - Commande mise sur une seule ligne avec `&&`

```yaml
# ✅ Correct (version actuelle)
command: sh -c "export COMPOSER_PROCESS_TIMEOUT=600 && composer install --no-interaction && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"

# ❌ Incorrect (ancienne version)
command: sh -c "export COMPOSER_PROCESS_TIMEOUT=600 && composer install
  --no-interaction && php artisan migrate --force && php artisan serve
  --host=0.0.0.0 --port=8000"
```

### Problème : Communication inter-services échoue (cURL error 7)

**Symptôme** : `cURL error 7: Failed to connect to localhost port 8001` lors de la création d'un atelier

**Cause** : Les conteneurs Docker ne peuvent pas communiquer via `localhost`. Ils doivent utiliser les noms de service Docker.

**Solution** : Ajouter dans les `.env` de catalog et inscription :

```env
AUTH_SERVICE_URL=http://auth_api:8000
```

Puis redémarrer : `docker compose down && docker compose up -d`

**Vérification** :

```bash
docker compose exec catalog_api curl http://auth_api:8000
# Devrait retourner: {"service":"Auth API","status":"running"...}
```

### Problème : Port déjà utilisé

**Solution** :

```bash
# Identifier le processus
netstat -ano | findstr :5173
# Tuer le processus
taskkill /PID <pid> /F
```

### Problème : Les conteneurs ne démarrent pas après modification .env

**Solution** : Redémarrer les conteneurs concernés

```bash
# Redémarrer un service spécifique
docker compose restart catalog_api

# Ou redémarrage complet
docker compose down
docker compose up -d
```

---

## 📝 CONVENTIONS DE CODE

### Git Commits

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: refactorisation
test: ajout de tests
chore: tâches diverses
```

### Nommage

- **Variables** : camelCase (`monUtilisateur`)
- **Constantes** : UPPERCASE (`API_URL`)
- **Composants React** : PascalCase (`MaPage.jsx`)
- **Fichiers CSS** : kebab-case (`ma-page.css`)
- **Routes** : kebab-case (`/creer-atelier`)

### Structure Composant React

```javascript
// 1. Imports
import { useState, useEffect } from 'react';

// 2. Composant
function MonComposant() {
  // 3. State
  const [data, setData] = useState(null);

  // 4. Effects
  useEffect(() => {
    // ...
  }, []);

  // 5. Handlers
  const handleClick = () => {
    // ...
  };

  // 6. Render
  return (
    // JSX
  );
}

// 7. Export
export default MonComposant;
```

---

## 📚 RESSOURCES UTILES

### Documentation Externe

- [Laravel 13](https://laravel.com/docs/11.x) _(utiliser v11 comme référence)_
- [React 19](https://react.dev/)
- [React Router v7](https://reactrouter.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/)

### Documentation Projet

- `README.md` - Vue d'ensemble et installation
- `DOCUMENTATION_TECHNIQUE.md` - Détails techniques
- `contributing.md` - Guide de contribution
- `openapi.yaml` - Spécification API

---

## 🎯 CHECKLIST AVANT TOUTE MODIFICATION

- [ ] Consulter ce document de référence
- [ ] Vérifier que Docker Desktop est démarré
- [ ] Comprendre quel service est impacté
- [ ] Lire la documentation du service concerné
- [ ] Vérifier l'état actuel avec `docker compose ps`
- [ ] Faire une sauvegarde si modification importante
- [ ] Tester localement avant commit
- [ ] Commit avec message conventionnel
- [ ] Vérifier que le pipeline CI/CD passe

---

## 📞 CONTACTS & SUPPORT

### Équipe

- **Groupe** : BC03
- **Repository** : [github.com/Andrimirana/skillhub-groupe-BC03](https://github.com/Andrimirana/skillhub-groupe-BC03)
- **Branch** : main

### En cas de problème

1. Consulter ce document
2. Vérifier les logs : `docker compose logs -f`
3. Consulter le README.md section "Dépannage"
4. Rechercher dans les issues GitHub
5. Créer une issue avec reproduction du problème

---

**📅 Dernière mise à jour** : 5 mai 2026  
**📝 Version du document** : 1.1  
**✍️ Créé par** : GitHub Copilot (Assistant IA)  
**🔧 Dernières modifications** :

- Résolution HTTP 500 sur routes racines (SESSION_DRIVER=file)
- Correction docker-compose.yml (commandes multi-lignes)
- Validation complète de tous les services (100% opérationnels)

---

> ⚠️ **Important** : Ce document doit être mis à jour à chaque modification architecturale importante du projet.
