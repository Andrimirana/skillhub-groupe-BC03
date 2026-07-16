# rule.md — Référence technique pour le projet SkillHub BC03

> Fichier de référence technique pour comprendre l’architecture et les conventions du projet.


---

## 1. Présentation du projet

**SkillHub** est une plateforme de mise en relation formateurs/apprenants développée dans le cadre du **Bloc 03 – Cloud, DevOps et Architecture** (Bachelor CDWFS, promo 2025/2026).

- Organisation GitHub : `andrimirana`
- Dépôt : `Andrimirana/skillhub-groupe-BC03`
- SonarCloud project key : `Andrimirana_skillhub-groupe-BC03`

---

## 2. Architecture globale

```
Architecture microservices (3 services Laravel + 1 frontend React)
├── frontend/          React 19 + Vite  → port 5173 (nginx en prod)
├── services/auth/     Laravel 13 / PHP 8.3 → port 8001
├── services/catalog/  Laravel 13 / PHP 8.3 → port 8002
├── services/inscription/ Laravel 13 / PHP 8.3 → port 8003
├── MySQL              (service Docker "db") → port 3306 interne
└── MongoDB            (service Docker "mongodb") → logs d'activité
```

Les services communiquent via noms Docker internes : `http://auth_api:8000`, `http://catalog_api:8000`, `http://catalog_api:8000`.  
**Aucun code partagé entre services** — chaque microservice est 100 % autonome.

---

## 3. Bases de données

| Service      | DB MySQL           | Collections MongoDB          |
|--------------|--------------------|------------------------------|
| auth         | `skillhub_auth`    | —                            |
| catalog      | `skillhub_catalog` | `skillhub_logs.activity_logs`|
| inscription  | `skillhub_enrollment` | `skillhub_logs.activity_logs`|

### Schémas principaux

**users** (auth)
```
id, name, email, password (bcrypt), role (formateur|apprenant),
email_verified_at, remember_token, created_at, updated_at
```

**formations** (catalog)
```
id, titre, description, category, date, statut, price (decimal:2),
duration (integer), level, vues, user_id, formateur_nom,
apprenants_count, created_at, updated_at
```

**modules** (catalog)
```
id, formation_id, titre, description, ordre, created_at, updated_at
```

**enrollments** (inscription)
```
id, utilisateur_id, formation_id, progression (integer),
date_inscription (datetime), created_at, updated_at
```

**activity_logs** (MongoDB — catalog & inscription)
```json
{ "event": "string", ...donnees, "timestamp": "ISO8601", "created_at": timestampMs }
```

---

## 4. Microservice Auth (`services/auth`)

### Routes API (`/api`)
| Méthode | URI                  | Middleware       | Contrôleur                      |
|---------|----------------------|------------------|---------------------------------|
| POST    | /validate-token      | aucun (interne)  | AuthController@validateToken    |
| POST    | /inscription         | AntiRejeuHmac    | AuthController@inscription      |
| POST    | /register            | AntiRejeuHmac    | AuthController@inscription      |
| POST    | /connexion           | AntiRejeuHmac    | AuthController@connexion        |
| POST    | /login               | AntiRejeuHmac    | AuthController@connexion        |
| GET     | /profil              | jwt              | AuthController@profil           |
| GET     | /profile             | jwt              | AuthController@profil           |
| PUT     | /change-password     | jwt              | AuthController@modifierMotDePasse |
| POST    | /deconnexion         | jwt              | AuthController@deconnexion      |
| POST    | /logout              | jwt              | AuthController@deconnexion      |

### Services clés
- **`ServiceJwt`** : JWT signé en HMAC-SHA256 maison (pas de bibliothèque externe). Payload : `sub, email, role, iat, exp`. Durée : **8 heures**.
- **`AntiRejeuHmac`** (middleware) : valide `X-HMAC-Signature`, `X-Nonce`, `X-Timestamp`. Fenêtre : **±5 minutes**. Nonce stocké en cache pour détecter les rejeux. Clé = `APP_MASTER_KEY`.
- **`VerifierJetonJwt`** (middleware `jwt`) : décode et valide le JWT, blackliste les tokens déconnectés via le cache.

### Validation inscription
```
nom: required|string|max:255
email: required|email|max:255|unique:users
mot_de_passe: required|min:8|regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
role: required|in:formateur,apprenant
```

---

## 5. Microservice Catalog (`services/catalog`)

### Routes API (`/api`)
| Méthode | URI                                   | Middleware       | Contrôleur                        |
|---------|---------------------------------------|------------------|-----------------------------------|
| GET     | /formations                           | public           | FormationController@index         |
| GET     | /formations/{id}                      | public           | FormationController@show          |
| GET     | /formations/{id}/modules              | public           | ModuleController@index            |
| GET     | /formations/{id}/logs                 | public           | ActivityLogController@getByFormation |
| GET     | /my-formations                        | auth.service     | FormationController@myFormations  |
| POST    | /formations                           | auth.service     | FormationController@store         |
| PUT     | /formations/{id}                      | auth.service     | FormationController@update        |
| DELETE  | /formations/{id}                      | auth.service     | FormationController@destroy       |
| POST    | /formations/{id}/modules              | auth.service     | ModuleController@store            |
| PUT     | /modules/{id}                         | auth.service     | ModuleController@update           |
| DELETE  | /modules/{id}                         | auth.service     | ModuleController@destroy          |

### Middleware `auth.service`
Valide le token JWT en appelant `POST /api/validate-token` sur `auth_api:8000`. Injecte `auth_user` dans la requête.

### Filtres `GET /formations`
Query params : `recherche` / `search`, `category`, `level`.  
Un formateur connecté ne voit que ses propres formations.

### Logging MongoDB
`MongoActivityLogger::log(string $event, array $data)` — utilisé dans `FormationController` et `ModuleController`. Silencieux si MongoDB est absent.

---

## 6. Microservice Inscription (`services/inscription`)

### Routes API (`/api`) — toutes privées (`auth.service`)
| Méthode | URI                                    | Contrôleur                       |
|---------|----------------------------------------|----------------------------------|
| POST    | /formations/{formationId}/inscription  | EnrollmentController@store       |
| DELETE  | /formations/{formationId}/inscription  | EnrollmentController@destroy     |
| GET     | /apprenant/formations                  | EnrollmentController@myCourses   |

---

## 7. Frontend React (`frontend/`)

### Stack
- React 19, React Router DOM 7, Axios 1.x, CryptoJS 4.x, FontAwesome 7
- Vite 5, ESLint 9

### Variables d'environnement (Vite)
```
VITE_AUTH_URL=http://127.0.0.1:8001/api
VITE_CATALOG_URL=http://127.0.0.1:8002/api
VITE_INSCRIPTION_URL=http://127.0.0.1:8003/api
VITE_APP_MASTER_KEY=<clé HMAC partagée>
```

### Clients API (`src/services/`)
| Fichier           | Service cible | Port  |
|-------------------|---------------|-------|
| `api.js`          | auth_api      | 8001  |
| `catalogApi.js`   | catalog_api   | 8002  |
| `inscriptionApi.js` | inscription_api | 8003 |

Tous les clients Axios partagent le même pattern :
- Interceptor **request** : ajoute `Authorization: Bearer <token>` depuis `localStorage`.
- Interceptor **response** : appelle `supprimerSession()` sur erreur 401.

### Stockage session (`src/services/auth.js`)
```
localStorage["jeton_auth"]       → token JWT (validé format 3 segments avant sauvegarde)
localStorage["utilisateur_auth"] → JSON { id, name, email, role }
```

### Sécurité HMAC côté client (`src/utils/security.js`)
`getSecurityHeaders(data)` génère `X-Nonce`, `X-Timestamp`, `X-HMAC-Signature` pour les appels inscription/connexion. Utilise `VITE_APP_MASTER_KEY`.

### Routing (`src/App.jsx`)
| Route                                | Accès         | Rôle requis  |
|--------------------------------------|---------------|--------------|
| `/`                                  | public        | —            |
| `/formations`                        | public        | —            |
| `/formation/:id`                     | public        | —            |
| `/connexion`                         | invité only   | —            |
| `/inscription`                       | invité only   | —            |
| `/dashboard/formateur`               | privé         | formateur    |
| `/creer-atelier`                     | privé         | formateur    |
| `/modifier-formation/:idFormation`   | privé         | formateur    |
| `/dashboard/apprenant`               | privé         | apprenant    |
| `/ateliers`                          | privé         | apprenant    |
| `/suivi/:idFormation`                | privé         | apprenant    |

`RouteProtegee` vérifie la session via `verifierSession()` (appel `/profil`) avant de rendre la route.

---

## 8. Infrastructure Docker

### Services Docker Compose
| Nom conteneur        | Image/Build           | Port externe | Port interne |
|----------------------|-----------------------|--------------|--------------|
| skillhub_frontend    | `./frontend`          | 5173         | 80           |
| skillhub_auth        | `./services/auth`     | 8001         | 8000         |
| skillhub_catalog     | `./services/catalog`  | 8002         | 8000         |
| skillhub_inscription | `./services/inscription` | 8003      | 8000         |
| db                   | MySQL                 | 3306 (interne) | 3306       |
| mongodb              | MongoDB               | 27017 (interne) | 27017     |

### Réseau
`skillhub_network` (bridge)

### Commandes utiles
```sh
docker compose up -d                                    # démarrer tout
docker compose exec auth_api php artisan migrate:fresh --seed
docker compose exec catalog_api php artisan migrate:fresh --seed
docker compose exec inscription_api php artisan migrate:fresh --seed
```

### Healthchecks
Les 3 microservices vérifient `php artisan --version` toutes les 30s, 3 retries, start_period 40s.  
Le frontend `depends_on` les 3 APIs avec `condition: service_healthy`.

---

## 9. CI/CD & Qualité

### Pipeline GitHub Actions (`.github/workflows/sonarcloud.yml`)
Déclenché sur push/PR vers `main` et `dev`.

**Job 1 : `tests-unitaires`**
- PHP 8.3 + xdebug
- Pour chaque service : `composer install` → copie `.env.example` → `key:generate` → SQLite en mémoire → `php artisan test --coverage-clover=coverage.xml`
- Upload des 3 rapports coverage en artifact

**Job 2 : `sonar-scan`** (dépend de job 1)
- Télécharge les coverage reports
- Lance le scan SonarCloud
- Quality Gate bloquante

### SonarCloud
- Sources analysées : `services/auth`, `services/catalog`, `services/inscription`
- Exclusions : `node_modules/`, `vendor/`, `storage/`, fichiers de config Laravel boilerplate, `Controller.php` de base
- Coverage : `coverage.xml` par service

---

## 10. Convention de code

### Git / Commits (Conventional Commits)
| Préfixe  | Usage                                  |
|----------|----------------------------------------|
| `feat`   | Nouvelle fonctionnalité                |
| `fix`    | Correction de bug                      |
| `docker` | Fichiers de conteneurisation           |
| `ci`     | Pipeline CI/CD                         |
| `docs`   | Documentation                          |
| `chore`  | Maintenance                            |

### Branches
- `main` : production, **aucun commit direct autorisé**
- `dev` : intégration par défaut
- `feature/<nom>` : développements
- `hotfix/<nom>` : correctifs urgents

### PHP (Laravel)
- Nommage en français pour les variables/méthodes métier (ex: `$utilisateur`, `$jeton`, `$requete`)
- Nommage en anglais pour les modèles, routes, colonnes DB
- PSR-4 autoloading
- Méthodes de présentation (`presenterFormation()`, `presenterUtilisateur()`) séparent le DTO de l'entité
- Hash bcrypt via `Hash::make()` pour les mots de passe
- Comparaison timing-safe via `Hash::check()` et `hash_equals()`

### JavaScript (React)
- Nommage en français pour les variables/états/fonctions (ex: `resultatSession`, `estAuthentifie`, `verifierSession`)
- Props en camelCase
- Composants en PascalCase
- Pages dans `src/pages/`, composants réutilisables dans `src/components/`
- Styles CSS modulaires dans `src/styles/`

---

## 11. Sécurité — Résumé des mécanismes

| Mécanisme          | Où                              | Détail                                                     |
|--------------------|---------------------------------|------------------------------------------------------------|
| JWT HMAC-SHA256    | Auth service → tous             | Signé avec `APP_KEY`, durée 8h, payload : sub/email/role/iat/exp |
| Blacklist JWT      | Auth service (cache Laravel)    | Token ajouté au cache à la déconnexion jusqu'à expiration  |
| HMAC anti-rejeu    | Auth service → frontend         | Headers : X-Nonce, X-Timestamp, X-HMAC-Signature. Fenêtre ±5 min. Clé = `APP_MASTER_KEY` |
| auth.service       | Catalog & Inscription           | Délègue la validation JWT à `auth_api:8000/api/validate-token` |
| Bcrypt             | Auth service                    | Hash des mots de passe avec `Hash::make()`                 |
| Validation mot de passe | Inscription               | min:8, 1 majuscule, 1 chiffre, 1 caractère spécial         |
| Token localStorage | Frontend                       | Validé format JWT (3 segments) avant stockage              |
| 401 auto-logout    | Frontend (interceptors Axios)   | `supprimerSession()` déclenché sur toute réponse 401       |

---

## 12. Variables d'environnement critiques

| Variable          | Service          | Usage                                    |
|-------------------|------------------|------------------------------------------|
| `APP_KEY`         | tous microservices | Clé Laravel (base de la signature JWT) |
| `APP_MASTER_KEY`  | auth             | Clé HMAC anti-rejeu (partagée avec frontend) |
| `JWT_SECRET`      | tous microservices | Référencé dans docker-compose (peut être identique à APP_KEY) |
| `DB_*`            | tous microservices | Connexion MySQL                         |
| `MONGO_URI`       | catalog, inscription | URI MongoDB                          |
| `MONGO_DATABASE`  | catalog, inscription | `skillhub_logs`                      |
| `MONGO_COLLECTION`| catalog, inscription | `activity_logs`                      |
| `AUTH_SERVICE_URL`| catalog, inscription | `http://auth_api:8000`              |
| `CATALOG_SERVICE_URL` | inscription  | `http://catalog_api:8000`            |
| `VITE_AUTH_URL`   | frontend         | `http://127.0.0.1:8001/api`            |
| `VITE_CATALOG_URL`| frontend         | `http://127.0.0.1:8002/api`            |
| `VITE_APP_MASTER_KEY` | frontend     | Doit matcher `APP_MASTER_KEY` du service auth |

---

## 13. Tests

- Framework : **PHPUnit 12** via `php artisan test`
- DB de test : **SQLite en mémoire** (`.env.example` + `touch database/database.sqlite`)
- Couverture : Xdebug + `--coverage-clover=coverage.xml`
- Fichiers de tests auth : `AuthControllerTest.php`, `AuthControllerAdditionalTest.php`

---

## 14. Équipe

| Rôle             | Membre  | Responsabilité principale                                    |
|------------------|---------|--------------------------------------------------------------|
| Cloud Architect  | Parfait | Rapport cloud, comparatif offres, schéma architecture, budget |
| DevOps Engineer  | Liwell  | Dockerfiles, docker-compose, pipeline CI/CD                  |
| Tech Lead        | Mirana  | Git, CONTRIBUTING.md, README, orchestration, SonarCloud      |
