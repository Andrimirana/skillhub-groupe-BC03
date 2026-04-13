<?php

namespace Database\Seeders;

use App\Models\Enrollment;
use App\Models\Formation;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $formateur = User::query()->updateOrCreate([
            'email' => 'formateur@skillhub.local',
        ], [
            'name' => 'Formateur SkillHub',
            'role' => 'formateur',
            'password' => Hash::make('formateur12345'),
            'email_verified_at' => now(),
        ]);

        $secondFormateur = User::query()->updateOrCreate([
            'email' => 'formateur2@skillhub.local',
        ], [
            'name' => 'Formateur React',
            'role' => 'formateur',
            'password' => Hash::make('formateur12345'),
            'email_verified_at' => now(),
        ]);

        User::query()->updateOrCreate([
            'email' => 'apprenant@skillhub.local',
        ], [
            'name' => 'Apprenant SkillHub',
            'role' => 'apprenant',
            'password' => Hash::make('apprenant12345'),
            'email_verified_at' => now(),
        ]);

        $apprenant = User::query()->where('email', 'apprenant@skillhub.local')->firstOrFail();

        Formation::query()->updateOrCreate([
            'titre' => 'Laravel API',
            'user_id' => $formateur->id,
        ], [
            'description' => 'Créer et sécuriser une API Laravel avec JWT.',
            'category' => 'Développement web',
            'date' => '2026-03-21',
            'statut' => 'À venir',
            'price' => 299.00,
            'duration' => 18,
            'level' => 'intermediaire',
            'vues' => 22,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'React avancé',
            'user_id' => $formateur->id,
        ], [
            'description' => 'Utilisation de React avec composants réutilisables.',
            'category' => 'Développement web',
            'date' => '2026-02-20',
            'statut' => 'Terminé',
            'price' => 249.00,
            'duration' => 14,
            'level' => 'advanced',
            'vues' => 18,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'Supervision Dashboard',
            'user_id' => $formateur->id,
        ], [
            'description' => 'Vue globale des ateliers côté formateur.',
            'category' => 'Design',
            'date' => '2026-04-10',
            'statut' => 'À venir',
            'price' => 199.00,
            'duration' => 10,
            'level' => 'beginner',
            'vues' => 12,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'React Hooks & State',
            'user_id' => $secondFormateur->id,
        ], [
            'description' => 'Gestion d\'état avancée avec hooks et patterns modernes.',
            'category' => 'Développement web',
            'date' => '2026-03-28',
            'statut' => 'À venir',
            'price' => 279.00,
            'duration' => 16,
            'level' => 'intermediaire',
            'vues' => 16,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'UX Dashboard Pro',
            'user_id' => $secondFormateur->id,
        ], [
            'description' => 'Construire des interfaces dashboard modernes et lisibles.',
            'category' => 'Design',
            'date' => '2026-01-18',
            'statut' => 'Terminé',
            'price' => 229.00,
            'duration' => 12,
            'level' => 'advanced',
            'vues' => 24,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'Sécurité JWT avancée',
            'user_id' => $formateur->id,
        ], [
            'description' => 'Bonnes pratiques de sécurité, expiration et refresh token.',
            'category' => 'DevOps',
            'date' => '2026-05-07',
            'statut' => 'À venir',
            'price' => 319.00,
            'duration' => 20,
            'level' => 'advanced',
            'vues' => 31,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'Tests API Laravel',
            'user_id' => $formateur->id,
        ], [
            'description' => 'Écrire des tests feature et unitaires pour des endpoints REST.',
            'category' => 'Data',
            'date' => '2026-02-08',
            'statut' => 'Terminé',
            'price' => 209.00,
            'duration' => 11,
            'level' => 'intermediaire',
            'vues' => 27,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'Accessibilité React',
            'user_id' => $secondFormateur->id,
        ], [
            'description' => 'Construire des interfaces accessibles et orientées clavier.',
            'category' => 'Design',
            'date' => '2026-04-14',
            'statut' => 'À venir',
            'price' => 189.00,
            'duration' => 9,
            'level' => 'beginner',
            'vues' => 14,
        ]);

        Formation::query()->updateOrCreate([
            'titre' => 'Vite et performances front',
            'user_id' => $secondFormateur->id,
        ], [
            'description' => 'Optimiser le build, le chargement et la performance côté client.',
            'category' => 'Développement web',
            'date' => '2026-01-11',
            'statut' => 'Terminé',
            'price' => 239.00,
            'duration' => 13,
            'level' => 'intermediaire',
            'vues' => 19,
        ]);

        $formations = Formation::query()->get();

        foreach ($formations as $formation) {
            if ($formation->modules()->count() < 3) {
                $modules = [
                    ['titre' => 'Introduction', 'contenu' => 'Présentation générale de la formation.', 'ordre' => 1],
                    ['titre' => 'Concepts fondamentaux', 'contenu' => 'Notions essentielles à maîtriser.', 'ordre' => 2],
                    ['titre' => 'Projet pratique', 'contenu' => 'Application concrète des compétences.', 'ordre' => 3],
                ];

                foreach ($modules as $module) {
                    Module::query()->updateOrCreate([
                        'formation_id' => $formation->id,
                        'ordre' => $module['ordre'],
                    ], [
                        'titre' => $module['titre'],
                        'contenu' => $module['contenu'],
                    ]);
                }
            }

            Enrollment::query()->firstOrCreate([
                'utilisateur_id' => $apprenant->id,
                'formation_id' => $formation->id,
            ], [
                'progression' => random_int(0, 80),
                'date_inscription' => now()->subDays(random_int(1, 90)),
            ]);
        }
    }
}
