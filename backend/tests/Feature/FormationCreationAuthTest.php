<?php

/*
| Projet: SkillHub
| Rôle du fichier: Tests feature pour création de formation avec auth
| Dernière modification: 2026-03-06
*/

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormationCreationAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_creation_formation_sans_token_retourne_401(): void
    {
        $reponse = $this->postJson('/api/formations', [
            'titre' => 'Formation sans token',
            'description' => 'Refus attendu',
            'category' => 'Développement web',
            'date' => '2026-07-01',
            'price' => 120,
            'duration' => 8,
            'level' => 'beginner',
        ]);

        $reponse->assertStatus(401);
    }

    public function test_creation_formation_avec_formateur_connecte_retourne_201(): void
    {
        $formateur = User::query()->create([
            'name' => 'Formateur Test',
            'email' => 'formateur.creation@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.creation@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->postJson('/api/formations', [
                'titre' => 'Formation valide',
                'description' => 'Créée avec succès',
                'category' => 'Développement web',
                'date' => '2026-07-03',
                'statut' => 'À venir',
                'price' => 250,
                'duration' => 12,
                'level' => 'intermediaire',
            ]);

        $reponse
            ->assertStatus(201)
            ->assertJsonPath('titre', 'Formation valide')
            ->assertJsonPath('user_id', $formateur->id);

        $this->assertDatabaseHas('formations', [
            'titre' => 'Formation valide',
            'user_id' => $formateur->id,
            'price' => 250,
            'duration' => 12,
            'level' => 'intermediaire',
        ]);
    }
}
