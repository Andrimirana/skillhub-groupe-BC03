# Guide technique SkillHub

Ce document explique comment l’application SkillHub est organisée, comment les données circulent, comment lancer le projet, et comment comprendre les pages principales.

## 1. Vue d’ensemble

SkillHub est une plateforme de formations en ligne avec deux rôles principaux :

- apprenant : consulte le catalogue, commence une formation, suit les modules/leçons, sauvegarde sa progression ;
- formateur : crée et gère ses formations depuis le dashboard.

L’application est composée de plusieurs parties :

- frontend React/Vite : interface utilisateur ;
- service Auth Java : inscription, connexion, validation du token ;
- service Catalog Laravel : formations, modules, détails de cours ;
- service Inscription Laravel : inscriptions apprenant, progression ;
- MySQL : données métier ;
- MongoDB : logs et activités.

## 2. Architecture des services

| Partie | Rôle | Port local |
|---|---:|---:|
| Frontend React | UI publique + dashboards | `5174` |
| Auth API Java | utilisateurs, login, register, token | `8001` |
| Catalog API Laravel | formations et modules | `8002` |
| Inscription API Laravel | inscriptions et progression | `8003` |
| MySQL | bases relationnelles | `3306` |
| MongoDB | logs d’activité | `27017` |

Les bases MySQL principales sont :

- `skillhub_catalog` : formations et modules ;
- `skillhub_enrollment` : inscriptions et progression ;
- base auth côté service Java pour les utilisateurs.

## 3. Frontend

Le frontend se trouve dans :

```txt
frontend/src
```

Pages importantes :

- `Accueil.jsx` : page d’accueil ;
- `Formations.jsx` : catalogue public ;
- `DetailFormation.jsx` : détail d’une formation ;
- `SuiviFormation.jsx` : page pour suivre une formation ;
- `CreerAtelier.jsx` : création de formation côté formateur ;
- `Apprenant.jsx` : dashboard apprenant ;
- `Formateur.jsx` : dashboard formateur ;
- `Profil.jsx` : profil utilisateur.

Services API côté frontend :

```txt
frontend/src/services/
```

Fichiers principaux :

- `authApi.js` : login/register ;
- `catalogApi.js` : client Axios vers le service Catalog ;
- `inscriptionApi.js` : client Axios vers le service Inscription ;
- `formationsApi.js` : fonctions métier utilisées par les pages.

## 4. Backend Catalog

Le service catalogue est ici :

```txt
services/catalog
```

Il gère :

- liste des formations ;
- détail d’une formation ;
- modules ;
- création/modification/suppression de formation par un formateur.

Modèles principaux :

- `Formation`
- `Module`

Tables principales :

- `formations`
- `modules`

Important : les formations sont gratuites. La colonne `price` a été supprimée de la base et de l’API.

## 5. Backend Inscription

Le service inscription est ici :

```txt
services/inscription
```

Il gère :

- inscription d’un apprenant à une formation ;
- désinscription ;
- liste des formations suivies ;
- sauvegarde de la progression.

Table principale :

- `enrollments`

Champs importants :

- `utilisateur_id`
- `formation_id`
- `progression`
- `completed_modules`
- `date_inscription`

## 6. Flux “Commencer une formation”

Quand un apprenant clique sur “Commencer” :

1. le frontend vérifie que l’utilisateur est connecté ;
2. si nécessaire, il ouvre la modale connexion/inscription ;
3. l’apprenant est inscrit via le service Inscription ;
4. l’application redirige vers `/apprendre/:id` ;
5. `SuiviFormation.jsx` charge la formation suivie et ses modules.

Correction importante :

Avant, si un apprenant ouvrait directement `/apprendre/37` sans inscription existante, la page disait que la formation n’était pas dans son espace. Maintenant, la page essaie d’inscrire automatiquement l’apprenant à la formation demandée, puis charge le parcours.

## 7. Flux “Suivre une formation”

La page :

```txt
/apprendre/:id
```

utilise `SuiviFormation.jsx`.

Elle affiche :

- navbar officielle ;
- hero de formation ;
- progression globale ;
- sidebar des modules ;
- leçon active ;
- notes personnelles locales ;
- bouton “Marquer comme terminé”.

Quand une leçon est terminée :

1. la clé de leçon est ajoutée dans l’état React ;
2. la progression est recalculée ;
3. la progression est envoyée à l’API Inscription ;
4. la prochaine leçon est sélectionnée.

La progression est sauvegardée dans `completed_modules` côté base.

## 8. Formations seedées

Le seeder catalogue crée exactement 10 formations, chacune avec 4 modules.

Seeder :

```txt
services/catalog/database/seeders/FormationSeeder.php
```

Pour relancer :

```bash
docker compose exec catalog_api php artisan db:seed --class=FormationSeeder
```

État attendu :

- 10 formations ;
- 40 modules ;
- 0 formation sans module.

Vérification MySQL :

```bash
docker compose exec db mysql -uskillhub_user -pskillhub_pass skillhub_catalog
```

Puis :

```sql
SELECT COUNT(*) AS formations FROM formations;
SELECT COUNT(*) AS modules FROM modules;
SELECT COUNT(*) AS formations_sans_module
FROM formations f
LEFT JOIN modules m ON m.formation_id = f.id
WHERE m.id IS NULL;
```

## 9. Commandes utiles

Démarrer le backend :

```bash
npm run backend:up
```

Démarrer le frontend :

```bash
npm --prefix frontend run dev
```

Voir les conteneurs :

```bash
npm run backend:ps
```

Logs backend :

```bash
npm run backend:logs
```

Lint frontend :

```bash
npm run frontend:lint
```

Build frontend :

```bash
npm run frontend:build
```

## 10. Dépannage

### `localhost:5174` ne répond pas

Le frontend Vite n’est probablement pas lancé.

Depuis le dossier racine :

```bash
npm --prefix frontend run dev
```

### `npm run dev` ne marche pas à la racine

Le `package.json` frontend est dans `frontend`.

Utiliser :

```bash
npm --prefix frontend run dev
```

### Une formation n’apparaît pas dans `/apprendre/:id`

Vérifier :

1. l’utilisateur est connecté comme apprenant ;
2. la formation existe dans `skillhub_catalog.formations` ;
3. le service inscription peut joindre le service catalogue ;
4. l’inscription existe dans `skillhub_enrollment.enrollments`.

Depuis la correction actuelle, ouvrir directement `/apprendre/:id` inscrit automatiquement l’apprenant si la formation existe.

### Les changements backend ne se voient pas

Dans ce projet, les conteneurs ne montent pas toujours le code local en live. Après modification backend, il faut parfois :

```bash
docker compose cp chemin/local.php catalog_api:/var/www/chemin/distant.php
docker compose cp chemin/local.php inscription_api:/var/www/chemin/distant.php
```

Ou reconstruire :

```bash
docker compose up -d --build
```

## 11. Points clés à retenir

- Le catalogue vient de la base `skillhub_catalog`.
- Le suivi apprenant vient de la base `skillhub_enrollment`.
- Les modules sont stockés dans la table `modules`.
- Le contenu détaillé d’un module est dans le champ JSON `contenu`.
- Les formations sont gratuites : il n’y a plus de prix dans la base catalogue.
- `/apprendre/:id` est la page réelle de suivi de formation.
