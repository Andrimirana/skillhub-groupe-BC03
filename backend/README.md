# Dash Laravel (BACKEND)

Backend API REST Laravel de SkillHub.
Ce service expose les endpoints d’authentification et de gestion des formations,
avec contrôle d’accès par rôle et authentification JWT (implémentation custom).

## 1) Stack backend

- PHP `^8.2`
- Laravel `^12.0`
- Base de données MySQL/MariaDB (via Eloquent)
- JWT signé HMAC SHA-256 (service interne)
- Documentation API via `darkaonline/l5-swagger`
- Tests via PHPUnit (`^11.5`)

## 2) Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

## 3) Lancement

```bash
php artisan serve
```

Base API par défaut:

`http://127.0.0.1:8000/api`

## 4) Architecture API

### Entrées HTTP

- `routes/api.php` contient l’ensemble des endpoints exposés.
- Les routes privées sont groupées sous le middleware `jwt`.

### Contrôleurs

- `AuthController`
    - inscription
    - connexion
    - profil
    - déconnexion
- `FormationController`
    - listing global/filtré par rôle
    - listing personnel formateur (`my-formations`)
    - création, modification, suppression avec contrôle de propriété

### Middleware de sécurité

- `VerifierJetonJwt`
    - valide la présence du bearer token
    - vérifie blacklist serveur
    - décode et valide signature/expiration du JWT
    - résout l’utilisateur courant dans la requête

### Service JWT

- `ServiceJwt`
    - génération de token HS256
    - validation signature
    - validation expiration (`exp`)
    - erreur explicite si segment/token invalide

## 5) Authentification et session

### Connexion / inscription

Chaque réponse d’auth fournit:

- `token`
- `token_type` (`Bearer`)
- `expires_at` (timestamp)
- `utilisateur` (`id`, `nom`, `email`, `role`)

### Durée de validité

- expiration actuelle: 8h (`exp`)

### Déconnexion sécurisée

- le token courant est blacklisté côté serveur
- la clé de blacklist est hashée (`sha256` du token)
- la durée de blacklist suit le temps restant avant expiration

## 6) Autorisation métier

### Rôles

- `formateur`
    - peut créer/modifier/supprimer ses propres formations
    - peut voir ses formations via `my-formations`
- `apprenant`
    - accès lecture au catalogue via `formations`
    - accès refusé pour la création/mutation

### Propriété ressource

Sur `update` et `destroy`, le backend vérifie que `formation.user_id` correspond à l’utilisateur connecté.

## 7) Contrats API

### Endpoints publics

- `POST /api/inscription`
- `POST /api/connexion`

### Endpoints protégés (`Authorization: Bearer <token>`)

- `GET /api/profil`
- `POST /api/deconnexion`
- `GET /api/my-formations`
- `GET /api/formations`
- `POST /api/formations`
- `PUT /api/formations/{formation}`
- `DELETE /api/formations/{formation}`

### Codes de statut importants

- `201`: inscription/création formation réussie
- `401`: token manquant ou identifiants invalides
- `403`: token invalide/expiré, rôle insuffisant ou ressource non autorisée
- `422`: validation Laravel

## 8) Validation des données

### Inscription

- `nom`: requis, string, max 255
- `email`: requis, email, unique
- `mot_de_passe`: min 8, au moins 1 majuscule, 1 chiffre, 1 caractère spécial
- `role`: `formateur` ou `apprenant`

### Formation (création)

- `titre`: requis
- `description`: requise
- `date`: date valide
- `statut`: optionnel, fallback `À venir`
- `price`: numérique, min 0
- `duration`: entier, min 1
- `level`: `beginner` | `intermediaire` | `advanced`

## 9) Modèle de réponse formation

Champs exposés:

- `id`
- `titre`
- `description`
- `date` (format `Y-m-d`)
- `statut`
- `price`
- `duration`
- `level`
- `vues`

`user_id` n’est inclus que dans les cas prévus côté formateur.

## 10) Tests

Exécution:

```bash
php artisan test
```

Les tests couvrent notamment:

- authentification (inscription/connexion/profil/déconnexion)
- protection des routes privées
- règles de rôle et propriété sur les formations
- comportements CRUD principaux

## 11) Documentation API

- Spécification OpenAPI: `public/docs/openapi.yaml`
- Swagger UI: `public/swagger.html`

## 12) Dépannage

### `php artisan serve` échoue

Vérifications rapides:

1. `.env` présent et valide
2. clé app générée (`php artisan key:generate`)
3. dépendances installées (`composer install`)
4. base de données accessible
5. migrations exécutées (`php artisan migrate`)

### Problèmes de token

- `401`: token absent ou session frontend vide
- `403`: token expiré/invalide ou blacklisté (après déconnexion)

### Erreurs de validation

- Inspecter la réponse `422` (`errors`) pour le détail champ par champ.
