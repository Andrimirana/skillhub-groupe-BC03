<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_apprenant_peut_s_inscrire_et_voir_ses_formations(): void
    {
        $formateur = User::query()->create([
            'name' => 'Formateur Enroll',
            'email' => 'formateur.enroll@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        User::query()->create([
            'name' => 'Apprenant Enroll',
            'email' => 'apprenant.enroll@test.local',
            'role' => 'apprenant',
            'password' => 'motdepasse123',
        ]);

        $formation = Formation::query()->create([
            'titre' => 'Formation inscription',
            'description' => 'Description inscription',
            'category' => 'Développement web',
            'date' => '2026-04-10',
            'statut' => 'À venir',
            'price' => 0,
            'duration' => 8,
            'level' => 'beginner',
            'vues' => 0,
            'user_id' => $formateur->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'apprenant.enroll@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->postJson('/api/formations/'.$formation->id.'/inscription')
            ->assertStatus(201);

        $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->getJson('/api/apprenant/formations')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $formation->id);
    }

    public function test_formateur_ne_peut_pas_s_inscrire(): void
    {
        $formateur = User::query()->create([
            'name' => 'Formateur Non Enroll',
            'email' => 'formateur.noenroll@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formation = Formation::query()->create([
            'titre' => 'Formation non inscriptible',
            'description' => 'Description',
            'category' => 'Développement web',
            'date' => '2026-04-10',
            'statut' => 'À venir',
            'price' => 0,
            'duration' => 8,
            'level' => 'beginner',
            'vues' => 0,
            'user_id' => $formateur->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.noenroll@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->postJson('/api/formations/'.$formation->id.'/inscription')
            ->assertStatus(403);
    }
}
