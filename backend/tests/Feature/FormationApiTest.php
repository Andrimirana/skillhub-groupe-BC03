<?php

/*
| Projet: SkillHub
| Rôle du fichier: Tests feature pour endpoints formations API
| Dernière modification: 2026-03-06
*/

namespace Tests\Feature;

use App\Models\Formation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_formations_retourne_le_catalogue_global_pour_un_formateur_connecte(): void
    {
        $formateurA = User::query()->create([
            'name' => 'Formateur A',
            'email' => 'formateur.a@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formateurB = User::query()->create([
            'name' => 'Formateur B',
            'email' => 'formateur.b@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        Formation::query()->create([
            'titre' => 'Formation A',
            'description' => 'Description A',
            'date' => '2026-03-20',
            'statut' => 'À venir',
            'vues' => 10,
            'user_id' => $formateurA->id,
        ]);

        Formation::query()->create([
            'titre' => 'Formation B',
            'description' => 'Description B',
            'date' => '2026-03-21',
            'statut' => 'À venir',
            'vues' => 12,
            'user_id' => $formateurB->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.a@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->getJson('/api/formations');

        $reponse
            ->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_delete_formation_supprime_une_formation_du_formateur_connecte(): void
    {
        $formateur = User::query()->create([
            'name' => 'Formateur C',
            'email' => 'formateur.c@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formation = Formation::query()->create([
            'titre' => 'Formation à supprimer',
            'description' => 'Description suppression',
            'date' => '2026-03-22',
            'statut' => 'À venir',
            'vues' => 5,
            'user_id' => $formateur->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.c@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->deleteJson('/api/formations/'.$formation->id);

        $reponse
            ->assertStatus(200)
            ->assertJsonPath('message', 'Formation supprimée avec succès.');

        $this->assertDatabaseMissing('formations', [
            'id' => $formation->id,
        ]);
    }

    public function test_put_formation_modifie_une_formation_du_formateur_connecte(): void
    {
        $formateur = User::query()->create([
            'name' => 'Formateur Update',
            'email' => 'formateur.update@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formation = Formation::query()->create([
            'titre' => 'Formation initiale',
            'description' => 'Description initiale',
            'date' => '2026-03-24',
            'statut' => 'À venir',
            'vues' => 7,
            'user_id' => $formateur->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.update@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->putJson('/api/formations/'.$formation->id, [
                'titre' => 'Formation modifiée',
                'description' => 'Description modifiée',
                'category' => 'Développement web',
                'date' => '2026-04-01',
                'statut' => 'Terminé',
                'price' => 250,
                'duration' => 12,
                'level' => 'advanced',
            ]);

        $reponse
            ->assertStatus(200)
            ->assertJsonPath('titre', 'Formation modifiée')
            ->assertJsonPath('statut', 'Terminé')
            ->assertJsonPath('price', 250)
            ->assertJsonPath('duration', 12)
            ->assertJsonPath('level', 'advanced');

        $this->assertDatabaseHas('formations', [
            'id' => $formation->id,
            'titre' => 'Formation modifiée',
            'description' => 'Description modifiée',
            'date' => '2026-04-01 00:00:00',
            'statut' => 'Terminé',
            'price' => 250,
            'duration' => 12,
            'level' => 'advanced',
        ]);
    }

    public function test_put_formation_refuse_la_modification_d_une_formation_d_un_autre_formateur(): void
    {
        $formateurA = User::query()->create([
            'name' => 'Formateur Owner A',
            'email' => 'formateur.ownera@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formateurB = User::query()->create([
            'name' => 'Formateur Owner B',
            'email' => 'formateur.ownerb@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formation = Formation::query()->create([
            'titre' => 'Formation non modifiable',
            'description' => 'Description non modifiable',
            'date' => '2026-03-25',
            'statut' => 'À venir',
            'vues' => 9,
            'user_id' => $formateurB->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.ownera@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->putJson('/api/formations/'.$formation->id, [
                'titre' => 'Tentative non autorisée',
                'description' => 'Tentative non autorisée',
                'category' => 'Développement web',
                'date' => '2026-04-02',
                'statut' => 'Terminé',
                'price' => 99,
                'duration' => 5,
                'level' => 'beginner',
            ]);

        $reponse
            ->assertStatus(403)
            ->assertJsonPath('message', 'Cette formation ne vous appartient pas.');

        $this->assertDatabaseHas('formations', [
            'id' => $formation->id,
            'titre' => 'Formation non modifiable',
        ]);
        $this->assertNotSame($formateurA->id, $formation->user_id);
    }

    public function test_delete_formation_refuse_la_suppression_d_une_formation_d_un_autre_formateur(): void
    {
        $formateurA = User::query()->create([
            'name' => 'Formateur D',
            'email' => 'formateur.d@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formateurB = User::query()->create([
            'name' => 'Formateur E',
            'email' => 'formateur.e@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formation = Formation::query()->create([
            'titre' => 'Formation protégée',
            'description' => 'Description protégée',
            'date' => '2026-03-23',
            'statut' => 'À venir',
            'vues' => 3,
            'user_id' => $formateurB->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.d@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->deleteJson('/api/formations/'.$formation->id);

        $reponse
            ->assertStatus(403)
            ->assertJsonPath('message', 'Cette formation ne vous appartient pas.');

        $this->assertDatabaseHas('formations', [
            'id' => $formation->id,
        ]);
    }

    public function test_get_formations_retourne_toutes_les_formations_pour_un_apprenant(): void
    {
        $formateurA = User::query()->create([
            'name' => 'Formateur A2',
            'email' => 'formateur.a2@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formateurB = User::query()->create([
            'name' => 'Formateur B2',
            'email' => 'formateur.b2@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        User::query()->create([
            'name' => 'Apprenant A',
            'email' => 'apprenant.a@test.local',
            'role' => 'apprenant',
            'password' => 'motdepasse123',
        ]);

        Formation::query()->create([
            'titre' => 'Formation Visible A',
            'description' => 'Description Visible A',
            'date' => '2026-05-01',
            'statut' => 'À venir',
            'vues' => 4,
            'user_id' => $formateurA->id,
        ]);

        Formation::query()->create([
            'titre' => 'Formation Visible B',
            'description' => 'Description Visible B',
            'date' => '2026-05-02',
            'statut' => 'Terminé',
            'vues' => 2,
            'user_id' => $formateurB->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'apprenant.a@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->getJson('/api/formations');

        $reponse
            ->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonMissingPath('0.user_id')
            ->assertJsonMissingPath('1.user_id');
    }

    public function test_post_formation_refuse_un_apprenant(): void
    {
        User::query()->create([
            'name' => 'Apprenant B',
            'email' => 'apprenant.b@test.local',
            'role' => 'apprenant',
            'password' => 'motdepasse123',
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'apprenant.b@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->postJson('/api/formations', [
                'titre' => 'Tentative apprenant',
                'description' => 'Non autorisé',
                'category' => 'Développement web',
                'date' => '2026-06-01',
                'statut' => 'À venir',
            ]);

        $reponse
            ->assertStatus(403)
            ->assertJsonPath('message', 'Seuls les formateurs peuvent créer une formation.');
    }

    public function test_post_formation_refuse_un_utilisateur_non_authentifie(): void
    {
        $reponse = $this->postJson('/api/formations', [
            'titre' => 'Formation sans token',
            'description' => 'Refus attendu',
            'category' => 'Développement web',
            'date' => '2026-07-01',
            'price' => 100,
            'duration' => 8,
            'level' => 'beginner',
        ]);

        $reponse->assertStatus(401);
    }

    public function test_post_formation_refuse_un_jeton_invalide_avec_code_403(): void
    {
        $reponse = $this
            ->withHeader('Authorization', 'Bearer jeton-invalide')
            ->postJson('/api/formations', [
                'titre' => 'Formation avec mauvais token',
                'description' => 'Refus attendu',
                'category' => 'Développement web',
                'date' => '2026-07-02',
                'price' => 110,
                'duration' => 8,
                'level' => 'beginner',
            ]);

        $reponse
            ->assertStatus(403)
            ->assertJsonPath('message', 'Jeton invalide ou expiré.');
    }

    public function test_get_my_formations_retourne_uniquement_les_formations_du_formateur_connecte(): void
    {
        $formateurA = User::query()->create([
            'name' => 'Formateur my A',
            'email' => 'formateur.my.a@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        $formateurB = User::query()->create([
            'name' => 'Formateur my B',
            'email' => 'formateur.my.b@test.local',
            'role' => 'formateur',
            'password' => 'motdepasse123',
        ]);

        Formation::query()->create([
            'titre' => 'Formation perso A',
            'description' => 'Description A',
            'date' => '2026-08-01',
            'statut' => 'À venir',
            'price' => 100,
            'duration' => 8,
            'level' => 'beginner',
            'vues' => 2,
            'user_id' => $formateurA->id,
        ]);

        Formation::query()->create([
            'titre' => 'Formation perso B',
            'description' => 'Description B',
            'date' => '2026-08-02',
            'statut' => 'Terminé',
            'price' => 120,
            'duration' => 9,
            'level' => 'intermediaire',
            'vues' => 3,
            'user_id' => $formateurB->id,
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'formateur.my.a@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->getJson('/api/my-formations');

        $reponse
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.titre', 'Formation perso A');
    }

    public function test_get_my_formations_refuse_un_apprenant(): void
    {
        User::query()->create([
            'name' => 'Apprenant my',
            'email' => 'apprenant.my@test.local',
            'role' => 'apprenant',
            'password' => 'motdepasse123',
        ]);

        $connexion = $this->postJson('/api/connexion', [
            'email' => 'apprenant.my@test.local',
            'mot_de_passe' => 'motdepasse123',
        ]);

        $jeton = $connexion->json('token');

        $reponse = $this
            ->withHeader('Authorization', 'Bearer '.$jeton)
            ->getJson('/api/my-formations');

        $reponse
            ->assertStatus(403)
            ->assertJsonPath('message', 'Seuls les formateurs peuvent accéder à leurs formations');
    }
}
