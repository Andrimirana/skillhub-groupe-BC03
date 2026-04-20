# SkillHub – Bloc 03 – Cloud, DevOps et Architecture

## Sommaire

1. Présentation générale
2. Architecture technique
3. Fonctionnalités détaillées
4. Structure du dépôt
5. Installation & démarrage
6. Configuration & secrets
7. Cycle de vie CI/CD
8. Sécurité & bonnes pratiques
9. Dépannage & FAQ
10. Contribution
11. Références & documentation

---

## 1. Présentation générale

SkillHub est une plateforme web collaborative de mise en relation entre formateurs et apprenants, développée dans le cadre du Bachelor Concepteur Développeur Web Full Stack (Bloc 03 : Cloud, DevOps et Architecture, Promotion 2025/2026).

Ce dépôt regroupe :

- Un frontend React (Vite)
- Trois microservices Laravel (auth, catalog, inscription)
- Une orchestration Docker
- Un pipeline CI/CD complet

Objectifs Bloc 03 : industrialisation, conteneurisation, automatisation, qualité logicielle

---

## 2. Architecture technique

### Frontend

- **React 19** (Vite)
- Authentification JWT/HMAC, gestion de session, routing protégé, UI moderne

### Backend (microservices Laravel)

- **services/auth** : Authentification, gestion des rôles, sécurité HMAC/anti-rejeu, endpoints JWT
- **services/catalog** : Gestion du catalogue de formations, modules, recherche, CRUD
- **services/inscription** : Gestion des inscriptions, suivi des apprenants, endpoints dédiés

### Base de données

- **MySQL**
- Migrations et seeders pour chaque microservice

### Orchestration & DevOps

- **Docker Compose** : orchestration multi-conteneurs
- **GitHub Actions** : lint, tests, build, analyse SonarCloud, Quality Gate
- **SonarCloud** : analyse de code, couverture, duplications, bugs

---

## 3. Fonctionnalités détaillées

### Authentification & sécurité

- Inscription, connexion, déconnexion, changement de mot de passe
- JWT pour l’authentification, HMAC pour la sécurité des requêtes sensibles
- Middleware anti-rejeu (nonce, timestamp, signature)
- Gestion des rôles (formateur, apprenant)

### Catalogue de formations

- CRUD formations, modules, recherche filtrée
- Attribution des formations aux formateurs
- Gestion des statuts, catégories, niveaux, durée, prix

### Inscriptions

- Inscription à une formation, suivi des apprenants
- Gestion des listes d’inscrits, validation, annulation

### Frontend

- Dashboard dynamique selon le rôle
- Routing public/privé, redirections intelligentes
- UI réactive, filtres, recherche, tableaux, sidebar, topbar, dark mode

### Communication inter-services

- Appels HTTP entre microservices via noms Docker (ex : http://auth_api:8000)
- Aucun code partagé, chaque service est indépendant

### Qualité & tests

- Tests unitaires pour chaque microservice (PHPUnit)
- Linting JS/PHP, ESLint côté frontend
- Analyse SonarCloud sur chaque PR

---

## 4. Structure du dépôt

```
/frontend                # Application React.js (Vite)
/services/auth           # Microservice Authentification (Laravel)
/services/catalog        # Microservice Catalogue (Laravel)
/services/inscription    # Microservice Inscriptions (Laravel)
/docker-compose.yml      # Orchestration multi-conteneurs
/DOCUMENTATION_TECHNIQUE.md # Doc technique détaillée
/rule.md                # Cahier des charges
/contributing.md        # Guide de contribution
/sonar-project.properties# Configuration SonarCloud
```

Chaque microservice contient :

- `app/`, `routes/`, `database/`, `config/`, `tests/`, `.env`, `composer.json`, `Dockerfile`, etc.

---

## 5. Installation & démarrage

### Prérequis

- Docker & Docker Compose
- Node.js 18+

### Clonage & lancement

```sh
git clone https://github.com/Andrimirana/skillhub-groupe-BC03.git
cd skillhub-groupe-BC03
docker compose up -d
```

Le frontend sera accessible sur le port 5173, les microservices sur 8001 (auth), 8002 (catalog), 8003 (inscription).

### Initialisation des bases de données

Les migrations sont lancées automatiquement au démarrage. Pour reseeder :

```sh
docker compose exec auth_api php artisan migrate:fresh --seed
docker compose exec catalog_api php artisan migrate:fresh --seed
docker compose exec inscription_api php artisan migrate:fresh --seed
```

### Lancer le frontend en mode dev

```sh
cd frontend
npm install
npm run dev
```

---

## 6. Configuration & secrets

Chaque microservice possède son propre fichier `.env` (voir `.env.example` dans chaque dossier).

Variables importantes :

- `APP_KEY`, `APP_MASTER_KEY` (HMAC), `DB_*`, `JWT_SECRET`, etc.
- Le frontend utilise `VITE_API_URL` pour cibler l’API.

**Ne jamais versionner les secrets en clair.**

---

## 7. Cycle de vie CI/CD

### Pipeline GitHub Actions

- Lint, tests unitaires, build, analyse SonarCloud à chaque push/PR
- Quality Gate bloquante

### SonarCloud

- Analyse de code, duplications, bugs, couverture
- Organisation : à renseigner dans `sonar-project.properties`

---

## 8. Sécurité & bonnes pratiques

- Authentification JWT, signature HMAC, anti-rejeu
- Séparation stricte des responsabilités (aucun code monolithe)
- Variables d’environnement pour tous les secrets
- Tests unitaires obligatoires
- Convention de nommage Git (Conventional Commits)

---

## 9. Dépannage & FAQ

### Problèmes courants

- **Erreur 401** : vérifier le token, la session, la synchro des clés JWT/HMAC
- **Connexion refusée entre services** : vérifier les URLs Docker (ex : `auth_api:8000`)
- **Pipeline CI/CD échouée** : vérifier la config SonarCloud, la présence des tests
- **Données non affichées** : vérifier le rôle, la session, les réponses API

### Commandes utiles

```sh
# Rebuild complet
docker compose down -v
docker compose up --build

# Logs d’un service
docker compose logs auth_api
```

---

## 10. Contribution

- Fork, branche thématique, PR, review
- Respecter le guide `contributing.md`
- Convention de commit : `type: sujet court`
- Tests et lint obligatoires avant merge

---

## 11. Références & documentation

- Documentation technique : `DOCUMENTATION_TECHNIQUE.md`
- Guide de contribution : `contributing.md`
- OpenAPI : `openapi.yaml`
- SonarCloud, GitHub Actions

---

## Auteurs & Encadrement

Projet réalisé par le groupe BC03 dans le cadre du Bachelor CDWFS, sous la supervision de l’équipe pédagogique.
