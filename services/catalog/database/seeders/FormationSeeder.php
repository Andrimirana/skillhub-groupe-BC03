<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;

class FormationSeeder extends Seeder
{
    public function run(): void
    {
        $formations = [
            [
                'titre' => 'Développement Web avec Laravel',
                'description' => 'Apprenez à créer des applications web robustes avec Laravel.',
                'category' => 'Développement',
                'price' => 0,
                'duration' => 30,
                'level' => 'beginner',
            ],
            [
                'titre' => 'React pour les débutants',
                'description' => 'Démarrez avec React et construisez des interfaces modernes.',
                'category' => 'Front-end',
                'price' => 0,
                'duration' => 20,
                'level' => 'beginner',
            ],
            [
                'titre' => 'Vue.js et l\'écosystème Composition API',
                'description' => 'Maîtrisez Vue 3 et la Composition API pour des apps réactives et maintenables.',
                'category' => 'Front-end',
                'price' => 80,
                'duration' => 18,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'Node.js et API REST avec Express',
                'description' => 'Construisez des API performantes avec Node.js, Express et MongoDB.',
                'category' => 'Back-end',
                'price' => 120,
                'duration' => 25,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'Python pour la Data Science',
                'description' => 'Analyse de données et visualisation avec Pandas, NumPy et Matplotlib.',
                'category' => 'Data',
                'price' => 150,
                'duration' => 35,
                'level' => 'beginner',
            ],
            [
                'titre' => 'Machine Learning avec Scikit-learn',
                'description' => 'Apprenez à entraîner des modèles supervisés et non supervisés en Python.',
                'category' => 'Data',
                'price' => 220,
                'duration' => 40,
                'level' => 'advanced',
            ],
            [
                'titre' => 'Docker et conteneurisation',
                'description' => 'Créez, déployez et orchestrez vos applications avec Docker et Compose.',
                'category' => 'DevOps',
                'price' => 100,
                'duration' => 15,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'Kubernetes en production',
                'description' => 'Déployez et opérez un cluster Kubernetes pour des charges réelles.',
                'category' => 'DevOps',
                'price' => 280,
                'duration' => 32,
                'level' => 'advanced',
            ],
            [
                'titre' => 'UX/UI Design avec Figma',
                'description' => 'Concevez des interfaces utilisateur modernes et accessibles avec Figma.',
                'category' => 'Design',
                'price' => 90,
                'duration' => 16,
                'level' => 'beginner',
            ],
            [
                'titre' => 'Cybersécurité : fondamentaux',
                'description' => 'Comprenez les bases de la sécurité offensive et défensive sur le web.',
                'category' => 'Sécurité',
                'price' => 180,
                'duration' => 28,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'TypeScript moderne',
                'description' => 'Adoptez TypeScript dans vos projets React et Node pour un code plus sûr.',
                'category' => 'Développement',
                'price' => 70,
                'duration' => 12,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'SQL avancé et optimisation',
                'description' => 'Requêtes complexes, index, plans d\'exécution et tuning de performance.',
                'category' => 'Data',
                'price' => 110,
                'duration' => 22,
                'level' => 'advanced',
            ],
            [
                'titre' => 'Next.js et rendu côté serveur',
                'description' => 'Construisez des applications React performantes avec SSR et l\'App Router de Next.js.',
                'category' => 'Front-end',
                'price' => 130,
                'duration' => 24,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'GraphQL avec Apollo',
                'description' => 'Concevez des API GraphQL flexibles avec Apollo côté client et serveur.',
                'category' => 'Back-end',
                'price' => 140,
                'duration' => 20,
                'level' => 'intermediaire',
            ],
            [
                'titre' => 'Tests automatisés en JavaScript',
                'description' => 'Maîtrisez Jest, Vitest et Playwright pour tester vos applications JS de bout en bout.',
                'category' => 'Développement',
                'price' => 95,
                'duration' => 18,
                'level' => 'beginner',
            ],
            [
                'titre' => 'AWS pour les développeurs',
                'description' => 'Déployez vos applications sur EC2, S3, Lambda et RDS pour des architectures scalables.',
                'category' => 'DevOps',
                'price' => 250,
                'duration' => 30,
                'level' => 'advanced',
            ],
            [
                'titre' => 'Marketing digital et SEO',
                'description' => 'Boostez la visibilité de vos projets avec le SEO, l\'analytics et les réseaux sociaux.',
                'category' => 'Marketing',
                'price' => 75,
                'duration' => 14,
                'level' => 'beginner',
            ],
        ];

        foreach ($formations as $formation) {
            Formation::create(array_merge($formation, [
                'date' => now(),
                'statut' => 'Ouvert',
                'vues' => 0,
                'user_id' => 1,
                'formateur_nom' => 'Formateur Test',
                'apprenants_count' => 0,
            ]));
        }
    }
}
