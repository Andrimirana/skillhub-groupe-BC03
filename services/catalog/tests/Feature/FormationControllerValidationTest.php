<?php

namespace Tests\Feature;

use App\Models\Formation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Tests de validation et edge cases pour FormationController
 * Complément à FormationControllerTest.php pour améliorer la couverture
 */
class FormationControllerValidationTest extends TestCase
{
    use RefreshDatabase;

    private array $profilFormateur;

    protected function setUp(): void
    {
        parent::setUp();
        $this->profilFormateur = ['id' => 1, 'nom' => 'Formateur', 'role' => 'formateur'];
    }

    private function simulerConnexion(array $userData): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $userData]),
        ]);
    }

    // Vérifie que la création d'une formation sans titre échoue avec une erreur de validation.
    public function test_create_formation_with_missing_title_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', [
            'description' => 'Description',
            'duree' => 10,
            'niveau' => 'débutant',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['titre']);
    }

    // Vérifie qu'un niveau de formation non reconnu est rejeté à la création.
    public function test_create_formation_with_invalid_niveau_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', [
            'titre' => 'Formation Laravel',
            'description' => 'Description complète',
            'duree' => 20,
            'niveau' => 'expert-avancé', // Invalid niveau
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['niveau']);
    }

    // Vérifie qu'une durée négative est refusée par la validation à la création.
    public function test_create_formation_with_negative_duree_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', [
            'titre' => 'Formation PHP',
            'description' => 'Description',
            'duree' => -5,
            'niveau' => 'intermédiaire',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['duree']);
    }

    // Vérifie qu'un titre dépassant la longueur maximale est refusé à la mise à jour.
    public function test_update_formation_with_too_long_title_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('token')->putJson("/api/formations/{$formation->id}", [
            'titre' => str_repeat('A', 300), // Titre trop long
            'description' => 'Description',
            'duree' => 15,
            'niveau' => 'débutant',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['titre']);
    }

    // Vérifie qu'une description vide est refusée à la mise à jour d'une formation.
    public function test_update_formation_with_empty_description_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('token')->putJson("/api/formations/{$formation->id}", [
            'titre' => 'Formation React',
            'description' => '',
            'duree' => 12,
            'niveau' => 'avancé',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['description']);
    }

    // Vérifie que la suppression d'une formation inexistante renvoie un 404.
    public function test_delete_nonexistent_formation_returns_404(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->deleteJson('/api/formations/999999');

        $reponse->assertNotFound();
    }

    // Vérifie que la mise à jour d'une formation inexistante renvoie un 404.
    public function test_update_nonexistent_formation_returns_404(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->putJson('/api/formations/999999', [
            'titre' => 'Formation mise à jour',
            'description' => 'Description',
            'duree' => 10,
            'niveau' => 'débutant',
        ]);

        $reponse->assertNotFound();
    }

    // Vérifie que l'affichage d'une formation inexistante renvoie un 404.
    public function test_show_nonexistent_formation_returns_404(): void
    {
        $reponse = $this->getJson('/api/formations/999999');
        $reponse->assertNotFound();
    }

    // Vérifie qu'une création avec des données valides aboutit à un 201 et insère bien la formation.
    public function test_create_formation_with_valid_data_creates_successfully(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $data = [
            'titre' => 'Formation Vue.js 3',
            'description' => 'Apprenez Vue.js 3 avec la Composition API',
            'duree' => 25,
            'niveau' => 'intermédiaire',
        ];

        $reponse = $this->withToken('token')->postJson('/api/formations', $data);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('formations', [
            'titre' => 'Formation Vue.js 3',
            'user_id' => 1,
        ]);
    }

    // Vérifie que la recherche par mot-clé renvoie uniquement les formations correspondantes.
    public function test_search_formations_with_query_parameter(): void
    {
        Formation::factory()->create(['titre' => 'Laravel Advanced', 'description' => 'Laravel avancé']);
        Formation::factory()->create(['titre' => 'PHP Basics', 'description' => 'PHP débutant']);
        Formation::factory()->create(['titre' => 'JavaScript ES6', 'description' => 'JS moderne']);

        $reponse = $this->getJson('/api/formations?search=Laravel');

        $reponse->assertOk();
        $reponse->assertJsonCount(1);
        $reponse->assertJsonFragment(['titre' => 'Laravel Advanced']);
    }

    // Vérifie que le filtrage par niveau renvoie le bon nombre de formations.
    public function test_filter_formations_by_niveau(): void
    {
        Formation::factory()->create(['titre' => 'Formation 1', 'niveau' => 'débutant']);
        Formation::factory()->create(['titre' => 'Formation 2', 'niveau' => 'débutant']);
        Formation::factory()->create(['titre' => 'Formation 3', 'niveau' => 'avancé']);

        $reponse = $this->getJson('/api/formations?niveau=débutant');

        $reponse->assertOk();
        $reponse->assertJsonCount(2);
    }
}
