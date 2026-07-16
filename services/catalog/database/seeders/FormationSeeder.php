<?php

namespace Database\Seeders;

use App\Models\Formation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FormationSeeder extends Seeder
{
    public function run(): void
    {
        Formation::query()->delete();

        $formateurs = [
            ['id' => 11, 'nom' => 'Sophie Martin'],
            ['id' => 12, 'nom' => 'Karim Benali'],
            ['id' => 13, 'nom' => 'Claire Dubois'],
            ['id' => 14, 'nom' => 'Nicolas Moreau'],
            ['id' => 15, 'nom' => 'Amina Diop'],
            ['id' => 16, 'nom' => 'Julien Lefèvre'],
            ['id' => 17, 'nom' => 'Camille Bernard'],
            ['id' => 18, 'nom' => 'Thomas Leroy'],
            ['id' => 19, 'nom' => 'Sarah Nguyen'],
            ['id' => 20, 'nom' => 'Mehdi El Amrani'],
        ];

        $formations = [
            [
                'titre' => 'Développement web avec React',
                'description' => "Créez des interfaces modernes avec React : composants, hooks, appels API, organisation du code et mise en production d'une application complète.",
                'category' => 'Développement web',
                'duration' => 18,
                'level' => 'beginner',
                'image_url' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Découvrir React', 'Maîtriser les hooks', 'Connecter une API', 'Publier une application'],
            ],
            [
                'titre' => 'Laravel et API REST',
                'description' => "Construisez un backend Laravel professionnel avec routes, contrôleurs, modèles, migrations, validation, sécurité et endpoints REST.",
                'category' => 'Développement web',
                'duration' => 22,
                'level' => 'intermediaire',
                'image_url' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Structurer Laravel', 'Modèles et migrations', 'Créer une API REST', 'Sécuriser et tester'],
            ],
            [
                'titre' => 'UI Design moderne avec Figma',
                'description' => "Concevez des interfaces propres et cohérentes avec Figma : grilles, composants, variantes, styles et responsive design.",
                'category' => 'Design',
                'duration' => 14,
                'level' => 'beginner',
                'image_url' => 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Bases UI', 'Identité visuelle', 'Composants Figma', 'Maquette responsive'],
            ],
            [
                'titre' => 'Marketing digital et SEO',
                'description' => "Développez une stratégie digitale claire : mots-clés, contenu, référencement naturel, analytics et amélioration continue.",
                'category' => 'Marketing',
                'duration' => 12,
                'level' => 'beginner',
                'image_url' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Stratégie marketing', 'SEO technique', 'Contenu qui convertit', 'Mesurer les résultats'],
            ],
            [
                'titre' => 'Analyse de données avec Python',
                'description' => "Explorez, nettoyez, analysez et visualisez des données avec Python, Pandas, NumPy et des graphiques lisibles.",
                'category' => 'Data',
                'duration' => 24,
                'level' => 'intermediaire',
                'image_url' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Environnement data', 'Nettoyage des données', 'Analyse Pandas', 'Visualisation'],
            ],
            [
                'titre' => 'Docker pour développeurs',
                'description' => "Comprenez Docker simplement : images, conteneurs, volumes, réseaux, Docker Compose et workflow de développement.",
                'category' => 'DevOps',
                'duration' => 16,
                'level' => 'intermediaire',
                'image_url' => 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Comprendre Docker', 'Créer une image', 'Composer plusieurs services', 'Préparer la production'],
            ],
            [
                'titre' => 'Gestion de projet agile',
                'description' => "Pilotez un projet avec backlog, priorisation, sprint, rituels agiles, suivi d’avancement et collaboration efficace.",
                'category' => 'Management',
                'duration' => 15,
                'level' => 'beginner',
                'image_url' => 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Comprendre l’agilité', 'Construire un backlog', 'Animer un sprint', 'Améliorer le flux'],
            ],
            [
                'titre' => 'TypeScript pour applications modernes',
                'description' => "Renforcez vos projets JavaScript avec TypeScript : types, interfaces, génériques, typage API et migration progressive.",
                'category' => 'Développement web',
                'duration' => 13,
                'level' => 'intermediaire',
                'image_url' => 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Configurer TypeScript', 'Types et interfaces', 'Génériques', 'Migrer un projet'],
            ],
            [
                'titre' => 'Cybersécurité web fondamentale',
                'description' => "Comprenez les risques essentiels du web : authentification, injections, XSS, permissions, bonnes pratiques et protection des données.",
                'category' => 'DevOps',
                'duration' => 20,
                'level' => 'intermediaire',
                'image_url' => 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Menaces courantes', 'Sécuriser les accès', 'Prévenir les failles web', 'Auditer une application'],
            ],
            [
                'titre' => 'Bases de données SQL',
                'description' => "Apprenez à modéliser, interroger et optimiser une base SQL : tables, relations, jointures, index et requêtes utiles.",
                'category' => 'Data',
                'duration' => 17,
                'level' => 'beginner',
                'image_url' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
                'modules' => ['Modéliser les données', 'Écrire des requêtes', 'Jointures et relations', 'Index et optimisation'],
            ],
        ];

        foreach ($formations as $index => $cours) {
            $formateur = $formateurs[$index % count($formateurs)];

            $formation = Formation::query()->create([
                'titre' => $cours['titre'],
                'description' => $cours['description'],
                'category' => $cours['category'],
                'date' => now()->subDays(count($formations) - $index),
                'statut' => 'Publié',
                'duration' => $cours['duration'],
                'level' => $cours['level'],
                'image_url' => $cours['image_url'],
                'vues' => 40 + ($index * 11),
                'user_id' => $formateur['id'],
                'formateur_nom' => $formateur['nom'],
                'apprenants_count' => 25 + ($index * 8),
            ]);

            foreach ($cours['modules'] as $ordre => $titreModule) {
                $formation->modules()->create([
                    'titre' => $titreModule,
                    'ordre' => $ordre + 1,
                    'contenu' => json_encode($this->contenuModule($titreModule, $ordre, $cours), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ]);
            }
        }
    }

    private function contenuModule(string $titreModule, int $index, array $cours): array
    {
        return [
            'description' => "Module de la formation {$cours['titre']} : comprendre, pratiquer et valider les notions essentielles.",
            'duration' => max(2, (int) ceil($cours['duration'] / count($cours['modules']))),
            'visible' => true,
            'debloquerApresPrecedent' => $index > 0,
            'lessons' => [
                [
                    'titre' => "Introduction — {$titreModule}",
                    'description' => 'Présentation des notions clés.',
                    'type' => 'Texte',
                    'duration' => 25,
                    'ordre' => 1,
                    'obligatoire' => true,
                    'preview' => $index === 0,
                    'contenu' => "Découvrez les bases de « {$titreModule} » avec des exemples simples.",
                    'videoUrl' => '',
                    'ressources' => [],
                ],
                [
                    'titre' => "Atelier pratique — {$titreModule}",
                    'description' => 'Mise en pratique guidée.',
                    'type' => 'Exercice pratique',
                    'duration' => 45,
                    'ordre' => 2,
                    'obligatoire' => true,
                    'preview' => false,
                    'contenu' => 'Réalisez un exercice court pour appliquer les concepts du module.',
                    'videoUrl' => '',
                    'ressources' => [],
                ],
            ],
            'quizzes' => [
                [
                    'titre' => "Quiz — {$titreModule}",
                    'scope' => $titreModule,
                    'instructions' => 'Choisissez la meilleure réponse.',
                    'tentatives' => 2,
                    'scoreMinimum' => 70,
                    'questions' => [
                        [
                            'enonce' => "Quel est l’objectif principal de « {$titreModule} » ?",
                            'type' => 'Choix unique',
                            'points' => 1,
                            'explication' => 'L’objectif est de comprendre puis pratiquer une compétence précise.',
                            'difficulte' => 'Facile',
                            'reponses' => [
                                ['texte' => 'Comprendre et appliquer les notions du module', 'correcte' => true],
                                ['texte' => 'Ignorer les exercices', 'correcte' => false],
                                ['texte' => 'Lire uniquement le titre', 'correcte' => false],
                            ],
                        ],
                    ],
                ],
            ],
            'progression' => [
                'mode' => 'séquentielle',
                'scoreFinal' => 70,
                'terminerToutesLecons' => true,
                'reussirTousQuiz' => false,
            ],
            'slug' => Str::slug($titreModule),
        ];
    }
}
