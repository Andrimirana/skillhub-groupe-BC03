<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des endpoints formations : routes publiques et routes protégées formateur
class FormationControllerTest extends TestCase
{
    use RefreshDatabase;

    // Profils utilisés pour simuler l'authentification via le middleware
    private array $profilFormateur = ['id' => 1, 'nom' => 'Alice', 'email' => 'alice@test.com', 'role' => 'formateur'];
    private array $profilApprenant = ['id' => 2, 'nom' => 'Bob', 'email' => 'bob@test.com', 'role' => 'apprenant'];

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('log')->andReturn(null);
        });
    }

    private function simulerConnexion(array $profil): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $profil], 200),
        ]);
    }

    public function test_list_formations_public(): void
    {
        Formation::factory()->count(3)->create();
        $reponse = $this->getJson('/api/formations');
        $reponse->assertOk()->assertJsonCount(3);
    }

    public function test_show_formation_increments_views(): void
    {
        $formation = Formation::factory()->create(['vues' => 0]);
        $this->getJson("/api/formations/{$formation->id}")->assertOk();
        $this->assertDatabaseHas('formations', ['id' => $formation->id, 'vues' => 1]);
    }

    public function test_show_formation_returns_data(): void
    {
        $formation = Formation::factory()->create(['titre' => 'Cours de test']);
        $reponse = $this->getJson("/api/formations/{$formation->id}");
        $reponse->assertOk()->assertJsonPath('titre', 'Cours de test');
    }

    public function test_create_formation_as_trainer(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $donneesFormation = [
            'titre'       => 'Formation Laravel',
            'description' => 'Apprenez Laravel de zéro',
            'category'    => 'dev',
            'date'        => '2026-09-01',
            'price'       => 150,
            'duration'    => 20,
            'level'       => 'beginner',
        ];

        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', $donneesFormation);
        $reponse->assertCreated()->assertJsonPath('titre', 'Formation Laravel');
        $this->assertDatabaseHas('formations', ['titre' => 'Formation Laravel']);
    }

    public function test_create_formation_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', []);
        $reponse->assertForbidden();
    }

    public function test_update_own_formation(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $donneesMaj = [
            'titre'       => 'Titre mis à jour',
            'description' => 'Description mise à jour',
            'category'    => 'design',
            'date'        => '2026-10-01',
        ];

        $reponse = $this->withToken('jeton-test')->putJson("/api/formations/{$formation->id}", $donneesMaj);
        $reponse->assertOk()->assertJsonPath('titre', 'Titre mis à jour');
    }

    public function test_update_other_formation_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->putJson("/api/formations/{$formationAutre->id}", [
            'titre'       => 'Tentative',
            'description' => 'x',
            'category'    => 'dev',
            'date'        => '2026-01-01',
        ]);

        $reponse->assertForbidden();
    }

    public function test_delete_own_formation(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formation->id}");
        $reponse->assertOk();
        $this->assertDatabaseMissing('formations', ['id' => $formation->id]);
    }

    public function test_delete_other_formation_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formationAutre->id}");
        $reponse->assertForbidden();
    }

    public function test_my_formations_returns_only_own(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        Formation::factory()->count(2)->create(['user_id' => 1]);
        Formation::factory()->count(3)->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertOk()->assertJsonCount(2);
    }

    public function test_my_formations_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertForbidden();
    }

    public function test_no_token_returns_401(): void
    {
        $reponse = $this->postJson('/api/formations', []);
        $reponse->assertUnauthorized();
    }

    public function test_list_formations_with_search_filter(): void
    {
        Formation::factory()->create(['titre' => 'Laravel Advanced', 'description' => 'Deep dive']);
        Formation::factory()->create(['titre' => 'PHP Basics', 'description' => 'Introduction to PHP']);

        $reponse = $this->getJson('/api/formations?recherche=Laravel');
        $reponse->assertOk()->assertJsonCount(1);
    }

    public function test_list_formations_with_category_filter(): void
    {
        Formation::factory()->create(['category' => 'dev']);
        Formation::factory()->create(['category' => 'design']);
        Formation::factory()->create(['category' => 'dev']);

        $reponse = $this->getJson('/api/formations?category=dev');
        $reponse->assertOk()->assertJsonCount(2);
    }

    public function test_list_formations_with_level_filter(): void
    {
        Formation::factory()->create(['level' => 'beginner']);
        Formation::factory()->create(['level' => 'advanced']);

        $reponse = $this->getJson('/api/formations?level=beginner');
        $reponse->assertOk()->assertJsonCount(1);
    }

    public function test_formateur_sees_only_own_formations_in_public_list(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        Formation::factory()->create(['user_id' => 1, 'titre' => 'Mine']);
        Formation::factory()->create(['user_id' => 99, 'titre' => 'Others']);

        $reponse = $this->withToken('jeton-test')->getJson('/api/formations');
        $reponse->assertOk()->assertJsonCount(1);
    }

    public function test_create_formation_with_modules(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $data = [
            'titre' => 'Formation with Modules',
            'description' => 'Test',
            'category' => 'dev',
            'date' => '2026-09-01',
            'price' => 100,
            'duration' => 10,
            'level' => 'beginner',
            'modules' => [
                ['titre' => 'Module 1', 'contenu' => 'Content 1'],
                ['titre' => 'Module 2', 'contenu' => 'Content 2'],
                ['titre' => 'Module 3', 'contenu' => 'Content 3'],
            ]
        ];

        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', $data);
        $reponse->assertCreated();
        $this->assertDatabaseHas('modules', ['titre' => 'Module 1']);
    }

    public function test_update_formation_with_partial_data(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create([
            'user_id' => 1,
            'titre' => 'Original',
            'price' => 100
        ]);

        $reponse = $this->withToken('jeton-test')->putJson("/api/formations/{$formation->id}", [
            'titre' => 'Updated Title',
            'description' => 'Updated Description',
            'category' => 'dev',
            'date' => '2026-08-01',
        ]);

        $reponse->assertOk();
        $this->assertEquals('Updated Title', $formation->fresh()->titre);
    }

    public function test_show_formation_includes_modules(): void
    {
        $formation = Formation::factory()->create();
        Module::factory()->count(2)->create(['formation_id' => $formation->id]);

        $reponse = $this->getJson("/api/formations/{$formation->id}");
        $reponse->assertOk()->assertJsonStructure(['modules']);
    }

    public function test_delete_formation_also_deletes_modules(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module = Module::factory()->create(['formation_id' => $formation->id]);

        $this->withToken('jeton-test')->deleteJson("/api/formations/{$formation->id}");

        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
    }

    public function test_create_formation_validation_fails_with_invalid_level(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $data = [
            'titre' => 'Test',
            'description' => 'Test',
            'category' => 'dev',
            'date' => '2026-09-01',
            'price' => 100,
            'duration' => 10,
            'level' => 'invalid_level',
        ];

        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', $data);
        $reponse->assertStatus(422)->assertJsonValidationErrors(['level']);
    }

    public function test_create_formation_requires_minimum_price(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $data = [
            'titre' => 'Test',
            'description' => 'Test',
            'category' => 'dev',
            'date' => '2026-09-01',
            'price' => -10,
            'duration' => 10,
            'level' => 'beginner',
        ];

        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', $data);
        $reponse->assertStatus(422)->assertJsonValidationErrors(['price']);
    }
}
