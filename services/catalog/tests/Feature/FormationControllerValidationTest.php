<?php

namespace Tests\Feature;

use App\Models\Formation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

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

    private function donneesValides(array $surcharge = []): array
    {
        return array_merge([
            'titre' => 'Formation SkillHub',
            'description' => 'Description complète',
            'category' => 'dev',
            'date' => '2026-09-01',
            'duration' => 20,
            'level' => 'beginner',
            'modules' => [
                ['titre' => 'Module 1', 'contenu' => 'Contenu 1'],
                ['titre' => 'Module 2', 'contenu' => 'Contenu 2'],
                ['titre' => 'Module 3', 'contenu' => 'Contenu 3'],
            ],
        ], $surcharge);
    }

    public function test_create_formation_with_missing_title_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $donnees = $this->donneesValides();
        unset($donnees['titre']);

        $reponse = $this->withToken('token')->postJson('/api/formations', $donnees);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['titre']);
    }

    public function test_create_formation_with_invalid_level_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', $this->donneesValides([
            'level' => 'expert-avance',
        ]));

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['level']);
    }

    public function test_create_formation_with_negative_duration_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', $this->donneesValides([
            'duration' => -5,
        ]));

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['duration']);
    }

    public function test_create_formation_with_one_module_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', $this->donneesValides([
            'modules' => [
                ['titre' => 'Module 1', 'contenu' => 'Contenu 1'],
            ],
        ]));

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['modules']);
    }

    public function test_update_formation_with_too_long_title_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('token')->putJson("/api/formations/{$formation->id}", [
            'titre' => str_repeat('A', 300),
            'description' => 'Description',
            'category' => 'dev',
            'date' => '2026-09-01',
            'duration' => 15,
            'level' => 'beginner',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['titre']);
    }

    public function test_update_formation_with_empty_description_fails(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('token')->putJson("/api/formations/{$formation->id}", [
            'titre' => 'Formation React',
            'description' => '',
            'category' => 'dev',
            'date' => '2026-09-01',
            'duration' => 12,
            'level' => 'advanced',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['description']);
    }

    public function test_delete_nonexistent_formation_returns_404(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->deleteJson('/api/formations/999999');

        $reponse->assertNotFound();
    }

    public function test_update_nonexistent_formation_returns_404(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->putJson('/api/formations/999999', $this->donneesValides());

        $reponse->assertNotFound();
    }

    public function test_show_nonexistent_formation_returns_404(): void
    {
        $reponse = $this->getJson('/api/formations/999999');
        $reponse->assertNotFound();
    }

    public function test_create_formation_with_valid_data_creates_successfully(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('token')->postJson('/api/formations', $this->donneesValides([
            'titre' => 'Formation Vue.js 3',
            'description' => 'Apprenez Vue.js 3 avec la Composition API',
            'duration' => 25,
            'level' => 'intermediaire',
        ]));

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('formations', [
            'titre' => 'Formation Vue.js 3',
            'user_id' => 1,
        ]);
    }

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

    public function test_filter_formations_by_level(): void
    {
        Formation::factory()->create(['titre' => 'Formation 1', 'level' => 'beginner']);
        Formation::factory()->create(['titre' => 'Formation 2', 'level' => 'beginner']);
        Formation::factory()->create(['titre' => 'Formation 3', 'level' => 'advanced']);

        $reponse = $this->getJson('/api/formations?level=beginner');

        $reponse->assertOk();
        $reponse->assertJsonCount(2);
    }
}
