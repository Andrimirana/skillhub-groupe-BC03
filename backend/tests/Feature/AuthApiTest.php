<?php

/*
| Projet: SkillHub
| Rôle du fichier: Tests feature pour endpoints auth API
| Dernière modification: 2026-03-06
*/

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_inscription_cree_un_utilisateur_et_retourne_un_jeton_jwt(): void
    {
        $reponse = $this->postJson('/api/inscription', [
            'nom' => 'Apprenant Test',
            'email' => 'apprenant@test.local',
            'mot_de_passe' => 'Motdepasse123!',
            'role' => 'apprenant',
        ]);

        $reponse
            ->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'token_type',
                'expires_at',
                'utilisateur' => ['id', 'nom', 'email', 'role'],
            ])
            ->assertJsonPath('utilisateur.role', 'apprenant');

        $this->assertDatabaseHas('users', [
            'email' => 'apprenant@test.local',
            'role' => 'apprenant',
        ]);
    }

    public function test_inscription_refuse_un_mot_de_passe_trop_faible(): void
    {
        $reponse = $this->postJson('/api/inscription', [
            'nom' => 'Apprenant Faible',
            'email' => 'faible@test.local',
            'mot_de_passe' => 'motdepasse123',
            'role' => 'apprenant',
        ]);

        $reponse
            ->assertStatus(422)
            ->assertJsonValidationErrors(['mot_de_passe']);
    }

    public function test_connexion_retourne_un_jeton_jwt(): void
    {
        User::query()->create([
            'name' => 'Formateur Test',
            'email' => 'formateur@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $reponse = $this->postJson('/api/connexion', [
            'email' => 'formateur@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $reponse
            ->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'token_type',
                'expires_at',
                'utilisateur' => ['id', 'nom', 'email', 'role'],
            ]);
    }

    public function test_deconnexion_invalide_le_jeton_cote_serveur(): void
    {
        User::query()->create([
            'name' => 'Utilisateur Logout',
            'email' => 'logout@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'logout@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->postJson('/api/deconnexion')
            ->assertStatus(200);

        $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->getJson('/api/profil')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Jeton invalide ou expiré.');
    }
}
