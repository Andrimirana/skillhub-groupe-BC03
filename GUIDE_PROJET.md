# Guide du projet SkillHub

Ce guide explique le **fonctionnement** et le **code** du projet SkillHub, plateforme de formations en microservices. Il est volontairement orienté pédagogie : tu peux le lire de haut en bas pour comprendre l'ensemble, ou aller directement à la section qui t'intéresse.

> Pour la documentation purement technique (specs, OpenAPI, etc.), voir `DOCUMENTATION_TECHNIQUE.md`.

---

## Table des matières

1. [Vision d'ensemble](#1-vision-densemble)
2. [Architecture](#2-architecture)
3. [Lancer le projet en local](#3-lancer-le-projet-en-local)
4. [Le service Auth](#4-le-service-auth-port-8001)
5. [Le service Catalog](#5-le-service-catalog-port-8002)
6. [Le service Inscription](#6-le-service-inscription-port-8003)
7. [Le frontend React](#7-le-frontend-react-port-5173)
8. [Sécurité : JWT + Anti-Rejeu HMAC](#8-sécurité--jwt--anti-rejeu-hmac)
9. [Tests](#9-tests)
10. [Glossaire](#10-glossaire)

---

## 1. Vision d'ensemble

SkillHub est une plateforme où :

- Les **formateurs** créent et gèrent des **formations** composées de **modules**.
- Les **apprenants** s'**inscrivent** aux formations et suivent leur **progression**.
- Toutes les actions importantes sont **journalisées** dans MongoDB.

L'application est découpée en **3 microservices Laravel** + un **frontend React**.

```
┌──────────────────┐
│   Frontend React │  http://localhost:5173
└─────────┬────────┘
          │ HTTP
   ┌──────┼──────────────────┐
   ▼      ▼                  ▼
┌─────┐ ┌────────┐ ┌────────────────┐
│Auth │ │Catalog │ │ Inscription    │
│8001 │ │ 8002   │ │ 8003           │
└──┬──┘ └───┬────┘ └────┬───────────┘
   │       │            │
   │       ▼            ▼
   │   MySQL (skillhub_catalog, skillhub_enrollment)
   ▼
MySQL (skillhub_auth)         MongoDB (logs activité)
```

---

## 2. Architecture

### Pourquoi des microservices ?

Chaque service a **sa propre base de données** et **son propre code**. Avantages :
- On peut faire évoluer / redéployer un service sans toucher aux autres.
- Si un service tombe (par ex. Catalog), Auth continue de fonctionner.
- Chaque équipe peut posséder un service.

### Comment ils communiquent ?

Les services s'appellent en **HTTP REST** entre eux. Exemples :
- Quand `Catalog` reçoit une requête avec un JWT, il appelle `Auth /api/validate-token` pour vérifier le jeton.
- Quand `Inscription` veut connaître les détails d'une formation, il appelle `Catalog /api/formations/{id}`.

Les URLs internes sont dans le `docker-compose.yml` :
```
AUTH_SERVICE_URL=http://auth_api:8000
CATALOG_SERVICE_URL=http://catalog_api:8000
```

### Bases de données

| Base | Service | Tables principales |
|------|---------|--------------------|
| `skillhub_auth` | Auth | `users` |
| `skillhub_catalog` | Catalog | `formations`, `modules` |
| `skillhub_enrollment` | Inscription | `enrollments` |
| `skillhub_logs` (Mongo) | Catalog + Inscription | `activity_logs` |

---

## 3. Lancer le projet en local

### Prérequis
- Docker Desktop
- Node.js 20+ et npm (pour le frontend en mode dev)

### Démarrage rapide

```bash
# 1. Créer le .env à la racine (s'il manque)
#    contient les credentials MySQL/Mongo - voir .env.example

# 2. Stopper MySQL XAMPP s'il tourne (port 3306)
net stop mysql

# 3. Lancer les services backend
docker compose up -d auth_api catalog_api inscription_api db mongodb

# 4. Lancer le frontend en dev (depuis frontend/)
cd frontend
npm install
npm run dev
```

Adresses :
- Frontend : http://localhost:5173
- Auth API : http://localhost:8001
- Catalog API : http://localhost:8002
- Inscription API : http://localhost:8003

### Seed de la base catalog
```bash
docker compose exec catalog_api php artisan migrate:fresh --seed
```
Charge **17 formations** définies dans [services/catalog/database/seeders/FormationSeeder.php](services/catalog/database/seeders/FormationSeeder.php).

---

## 4. Le service Auth (port 8001)

**Rôle** : gérer l'inscription, la connexion, et émettre les JWT que les autres services utiliseront.

### Endpoints principaux
| Méthode | URL | Rôle |
|---------|-----|------|
| POST | `/api/inscription` | Crée un compte (apprenant ou formateur) |
| POST | `/api/connexion` | Renvoie un JWT |
| POST | `/api/validate-token` | **Endpoint interne** : valide un JWT et renvoie l'utilisateur |
| GET | `/api/profil` | Renvoie le profil de l'utilisateur connecté |
| PUT | `/api/change-password` | Modifie le mot de passe |
| POST | `/api/deconnexion` | Invalide la session |

### Code clé

#### [`AuthController.php`](services/auth/app/Http/Controllers/AuthController.php)
Le cœur du service. La méthode `validateToken()` est appelée par les autres microservices : elle décode le JWT et renvoie l'utilisateur correspondant.

#### [`ServiceJwt.php`](services/auth/app/Services/ServiceJwt.php)
Génère et vérifie les JWT. Chaque jeton est composé de 3 segments :
```
<header_base64>.<payload_base64>.<signature_HMAC_SHA256>
```
La signature est calculée avec `app.key` (secret) — donc personne ne peut forger un JWT sans cette clé.

#### Middlewares
- `AntiRejeuHmac` : protège `/inscription` et `/connexion` contre les attaques par **rejeu** (voir [section 8](#8-sécurité--jwt--anti-rejeu-hmac)).
- `VerifierJetonJwt` (alias `jwt`) : protège les routes privées en exigeant un JWT valide.

### Schéma de la table `users`
| Colonne | Type | Note |
|---------|------|------|
| id | bigint | PK |
| name | string | |
| email | string unique | |
| password | string (hash bcrypt) | |
| role | enum('apprenant','formateur') | ajouté en migration `2026_03_05` |

---

## 5. Le service Catalog (port 8002)

**Rôle** : gérer le catalogue de formations et leurs modules. C'est le service le plus riche.

### Endpoints principaux

| Méthode | URL | Visibilité | Rôle |
|---------|-----|------------|------|
| GET | `/api/formations` | publique | Liste toutes les formations (filtres : `recherche`, `category`, `level`) |
| GET | `/api/formations/{id}` | publique | Détail d'une formation + modules. Incrémente le compteur de vues. |
| GET | `/api/formations/{id}/modules` | publique | Modules seuls |
| GET | `/api/my-formations` | formateur | Les formations créées par le formateur connecté |
| POST | `/api/formations` | formateur | Crée une formation (avec ses modules optionnellement) |
| PUT | `/api/formations/{id}` | formateur (propriétaire) | Modifier |
| DELETE | `/api/formations/{id}` | formateur (propriétaire) | Supprimer (cascade sur modules) |
| POST/PUT/DELETE | `/api/modules/...` | formateur (propriétaire) | CRUD des modules |
| GET | `/api/formations/{id}/logs` | publique | 50 derniers logs MongoDB d'une formation |

### Code clé

#### [`FormationController.php`](services/catalog/app/Http/Controllers/FormationController.php)
- `index()` filtre par recherche / catégorie / niveau.
- `store()` crée la formation **et** ses modules dans une transaction.
- `update()` et `destroy()` vérifient que l'utilisateur authentifié est bien le **propriétaire** (`user_id`).

#### [`ModuleController.php`](services/catalog/app/Http/Controllers/ModuleController.php)
Gère les modules. Si l'`ordre` n'est pas fourni à la création, il est calculé automatiquement (`max(ordre) + 1`).

#### [`MongoActivityLogger.php`](services/catalog/app/Services/MongoActivityLogger.php)
Service injecté dans les contrôleurs qui écrit un document dans `activity_logs` (Mongo) à chaque action importante (création, vue, etc.). Utile pour audit & analytics.

### Modèles Eloquent
- [`Formation`](services/catalog/app/Models/Formation.php) → `hasMany(Module)`, ordonnés par `ordre`.
- [`Module`](services/catalog/app/Models/Module.php) → `belongsTo(Formation)`.
- [`ActivityLog`](services/catalog/app/Models/ActivityLog.php) → modèle MongoDB.

### Middleware `auth.service`
Toutes les routes privées passent par [`ValidateServiceToken`](services/catalog/app/Http/Middleware/ValidateServiceToken.php). Ce middleware :
1. Extrait le token Bearer de la requête.
2. Appelle `Auth /api/validate-token` pour le vérifier.
3. Injecte l'utilisateur dans `$request->input('auth_user')` pour les contrôleurs.

C'est un **pattern classique en microservices** : le service Auth est la seule source de vérité pour l'identité.

---

## 6. Le service Inscription (port 8003)

**Rôle** : gérer les inscriptions des apprenants aux formations.

### Endpoints

| Méthode | URL | Rôle |
|---------|-----|------|
| POST | `/api/formations/{id}/inscription` | L'apprenant s'inscrit à une formation |
| DELETE | `/api/formations/{id}/inscription` | L'apprenant se désinscrit |
| GET | `/api/apprenant/formations` | Liste des formations suivies (avec progression) |

### Code clé

#### [`EnrollmentController.php`](services/inscription/app/Http/Controllers/EnrollmentController.php)

- `store()` : avant de créer l'inscription, **vérifie que la formation existe** auprès de Catalog (HTTP call). Crée ensuite un `Enrollment` (avec progression à 0).
- `myCourses()` : pour chaque inscription, va chercher le détail de la formation auprès de Catalog et fusionne avec la progression.

C'est ici que se trouve la **logique métier** : seul un apprenant peut s'inscrire (vérif via `auth_user.role === 'apprenant'`).

### Schéma de la table `enrollments`
| Colonne | Type |
|---------|------|
| id | bigint PK |
| utilisateur_id | bigint |
| formation_id | bigint |
| progression | int (0-100) |
| date_inscription | datetime |

> **Note** : il n'y a pas encore d'endpoint pour mettre à jour la progression. Pour l'instant la page de suivi affiche un état local.

---

## 7. Le frontend React (port 5173)

Stack : **React 19 + Vite (rolldown-vite) + React Router 7**.

### Structure
```
frontend/src
├── App.jsx               # routes
├── main.jsx              # point d'entrée
├── components            # composants réutilisables
│   ├── Sidebar.jsx
│   ├── Topbar.jsx
│   ├── AtelierCard.jsx   # carte d'une formation
│   ├── RouteProtegee.jsx # garde-fou pour les routes privées
│   └── ...
├── pages                 # pages = écrans
│   ├── Accueil.jsx
│   ├── Connexion.jsx, Inscription.jsx
│   ├── Formations.jsx          # catalogue public
│   ├── DetailFormation.jsx     # détail + bouton Suivre / Voir progression
│   ├── Apprenant.jsx           # dashboard apprenant
│   ├── Formateur.jsx, Ateliers.jsx
│   ├── CreerAtelier.jsx        # formulaire création de formation
│   ├── ModifierFormation.jsx
│   └── SuiviFormation.jsx      # page de progression
├── services              # appels HTTP
│   ├── auth.js               # lecture/écriture du token en localStorage
│   ├── api.js                # client axios commun
│   ├── authApi.js            # appels au service Auth
│   ├── catalogApi.js         # client axios → Catalog
│   ├── inscriptionApi.js     # client axios → Inscription
│   ├── formationsApi.js      # API métier (façade par-dessus catalog/inscription)
│   └── session.js            # vérification de session
└── styles                # CSS par page/composant
```

### Routage (App.jsx)

```jsx
<Routes>
  <Route path="/" element={<Accueil />} />
  <Route path="/formations" element={<Formations />} />
  <Route path="/formation/:id" element={<DetailFormation />} />

  <Route element={<RouteInvite />}>
    <Route path="/connexion" element={<Connexion />} />
    <Route path="/inscription" element={<Inscription />} />
  </Route>

  <Route element={<RouteProtegee rolesAutorises={["formateur"]} />}>
    <Route path="/dashboard/formateur" element={<Formateur />} />
    <Route path="/creer-atelier" element={<CreerAtelier />} />
    <Route path="/modifier-formation/:idFormation" element={<ModifierFormation />} />
  </Route>

  <Route element={<RouteProtegee rolesAutorises={["apprenant"]} />}>
    <Route path="/dashboard/apprenant" element={<Apprenant />} />
    <Route path="/apprendre/:id" element={<SuiviFormation />} />
  </Route>
</Routes>
```

`RouteProtegee` redirige vers `/connexion` si l'utilisateur n'est pas authentifié, et vers son propre dashboard s'il n'a pas le bon rôle.

### Flux principaux

#### 1. Connexion
1. L'utilisateur soumet `Connexion.jsx`.
2. `authApi.connecter()` appelle `POST /api/login` avec les en-têtes HMAC anti-rejeu.
3. Le token JWT reçu est stocké dans `localStorage` (`auth.js`).
4. Redirection vers `/dashboard/apprenant` ou `/dashboard/formateur`.

#### 2. Voir une formation
1. `Formations.jsx` charge `GET /api/formations` (Catalog).
2. Au clic sur une carte → `DetailFormation.jsx` (`/formation/:id`).
3. La page demande aussi `listerFormationsApprenant()` pour savoir si l'utilisateur est déjà inscrit.
4. Si déjà inscrit → bouton **"Voir la progression"** (lien vers `/apprendre/:id`).
5. Sinon → bouton **"Suivre la formation"** qui appelle Inscription.

#### 3. Suivre sa progression
1. `Apprenant.jsx` charge ses formations et affiche les cartes.
2. Bouton **"Continuer à se former"** → navigation vers `/apprendre/:id`.
3. `SuiviFormation.jsx` :
   - Cercle SVG de progression (calculé à partir des modules cochés)
   - Stats (terminés / restants / statut)
   - Liste de modules avec cases à cocher

> Pour l'instant, l'état des modules cochés est **local** (state React). Il faudrait un endpoint backend pour le persister.

### Couche services

`services/api.js` configure axios. Les autres `*Api.js` injectent automatiquement le JWT dans les requêtes :

```js
// catalogApi.js
catalogApi.interceptors.request.use((config) => {
  const token = recupererJeton();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Pour les requêtes HMAC (login/register), `services/api.js` ajoute aussi `X-HMAC-Signature`, `X-Nonce` et `X-Timestamp`.

---

## 8. Sécurité : JWT + Anti-Rejeu HMAC

### JWT — Authentification

Le service Auth émet un JWT à la connexion. Tous les autres services valident ce JWT en appelant `Auth /api/validate-token`. Avantages :
- **Stateless** : pas de session côté serveur.
- **Source unique** : seul Auth connaît la clé secrète.

### HMAC — Anti-rejeu sur les routes sensibles

Pour `/inscription` et `/connexion`, on ne veut pas qu'un attaquant rejoue une requête capturée. Le client envoie 3 en-têtes :

| En-tête | Rôle |
|---------|------|
| `X-Timestamp` | timestamp Unix actuel |
| `X-Nonce` | UUID unique généré côté client |
| `X-HMAC-Signature` | `HMAC_SHA256(body + nonce + timestamp, APP_MASTER_KEY)` |

Le middleware [`AntiRejeuHmac`](services/auth/app/Http/Middleware/AntiRejeuHmac.php) :
1. Refuse si timestamp > 5 min de décalage.
2. Refuse si le nonce a déjà été vu (cache Laravel).
3. Recalcule la signature et compare avec `hash_equals`.

Résultat : même si quelqu'un capture la requête, il ne peut pas la rejouer ni en forger une nouvelle.

---

## 9. Tests

Chaque service a sa suite PHPUnit dans `services/<service>/tests/`.

### Lancer les tests
```bash
docker compose exec auth_api php artisan test
docker compose exec catalog_api php artisan test
docker compose exec inscription_api php artisan test
```

### Organisation
- `tests/Feature/` : tests d'intégration (HTTP → contrôleur → DB).
- `tests/Unit/` : tests unitaires (modèle, service, middleware).

### Conventions
Chaque méthode `test_*` est précédée d'un commentaire en français qui explique en une phrase ce qu'elle vérifie. Exemple :

```php
// Vérifie qu'un formateur peut modifier sa propre formation.
public function test_update_own_formation(): void { ... }
```

### Mocks importants
- `Http::fake()` est utilisé pour simuler `Auth /api/validate-token` (évite de devoir lancer le service Auth pendant les tests Catalog/Inscription).
- `MongoActivityLogger` est mocké via `$this->mock(...)` pour ne pas écrire dans Mongo en test.

---

## 10. Glossaire

| Terme | Définition |
|-------|-----------|
| **Formateur** | Utilisateur qui crée et gère des formations. |
| **Apprenant** | Utilisateur qui s'inscrit aux formations. |
| **Formation** | Cours composé de plusieurs modules. |
| **Module** | Chapitre d'une formation, avec un titre, un contenu et un ordre. |
| **Inscription** (`Enrollment`) | Lien entre un apprenant et une formation. Porte la progression. |
| **JWT** | JSON Web Token, jeton d'authentification signé. |
| **HMAC** | Hash-based Message Authentication Code. Signature qui prouve qu'un message n'a pas été altéré. |
| **Nonce** | "Number used once". Empêche de rejouer une requête. |
| **Microservice** | Service indépendant qui ne fait qu'une chose. SkillHub en a 3 : Auth, Catalog, Inscription. |

---

## Pour aller plus loin

- **Lire un endpoint complet** : commence par `routes/api.php` du service, suis vers le contrôleur, puis le modèle.
- **Comprendre une page** : regarde le composant React, suis les imports vers `services/*.js`, puis vers les routes Laravel.
- **Ajouter une feature** : crée la migration → modèle → contrôleur → route → composant React → test. C'est dans cet ordre qu'on évite les blocages.

