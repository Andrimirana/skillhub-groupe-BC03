<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Models\Module;
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

    // Vérifie que la liste publique des formations renvoie bien toutes les formations en base.
    public function test_list_formations_public(): void
    {
        Formation::factory()->count(3)->create();
        $reponse = $this->getJson('/api/formations');
        $reponse->assertOk()->assertJsonCount(3);
    }

    // Vérifie qu'un appel sur le détail d'une formation incrémente le compteur de vues.
    public function test_show_formation_increments_views(): void
    {
        $formation = Formation::factory()->create(['vues' => 0]);
        $this->getJson("/api/formations/{$formation->id}")->assertOk();
        $this->assertDatabaseHas('formations', ['id' => $formation->id, 'vues' => 1]);
    }

    // Vérifie que le détail d'une formation contient les données attendues comme le titre.
    public function test_show_formation_returns_data(): void
    {
        $formation = Formation::factory()->create(['titre' => 'Cours de test']);
        $reponse = $this->getJson("/api/formations/{$formation->id}");
        $reponse->assertOk()->assertJsonPath('titre', 'Cours de test');
    }

    // Vérifie qu'un formateur authentifié peut créer une nouvelle formation.
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

    // Vérifie qu'un apprenant ne peut pas créer de formation et reçoit une erreur 403.
    public function test_create_formation_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', []);
        $reponse->assertForbidden();
    }

    // Vérifie qu'un formateur peut modifier sa propre formation.
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

    // Vérifie qu'un formateur ne peut pas modifier la formation d'un autre formateur.
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

    // Vérifie qu'un formateur peut supprimer sa propre formation.
    public function test_delete_own_formation(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formation->id}");
        $reponse->assertOk();
        $this->assertDatabaseMissing('formations', ['id' => $formation->id]);
    }

    // Vérifie qu'un formateur ne peut pas supprimer la formation d'un autre formateur.
    public function test_delete_other_formation_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formationAutre->id}");
        $reponse->assertForbidden();
    }

    // Vérifie que /api/my-formations ne renvoie que les formations du formateur connecté.
    public function test_my_formations_returns_only_own(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        Formation::factory()->count(2)->create(['user_id' => 1]);
        Formation::factory()->count(3)->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertOk()->assertJsonCount(2);
    }

    // Vérifie qu'un apprenant ne peut pas accéder à la liste my-formations (réservée aux formateurs).
    public function test_my_formations_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertForbidden();
    }

    // Vérifie qu'une requête sans token JWT renvoie une erreur 401.
    public function test_no_token_returns_401(): void
    {
        $reponse = $this->postJson('/api/formations', []);
        $reponse->assertUnauthorized();
    }

    // Vérifie que le filtre de recherche par mot-clé filtre bien les formations par titre/description.
    public function test_list_formations_with_search_filter(): void
    {
        Formation::factory()->create(['titre' => 'Laravel Advanced', 'description' => 'Deep dive']);
        Formation::factory()->create(['titre' => 'PHP Basics', 'description' => 'Introduction to PHP']);

        $reponse = $this->getJson('/api/formations?recherche=Laravel');
        $reponse->assertOk()->assertJsonCount(1);
    }

    // Vérifie que le filtre de catégorie ne renvoie que les formations de la catégorie demandée.
    public function test_list_formations_with_category_filter(): void
    {
        Formation::factory()->create(['category' => 'dev']);
        Formation::factory()->create(['category' => 'design']);
        Formation::factory()->create(['category' => 'dev']);

        $reponse = $this->getJson('/api/formations?category=dev');
        $reponse->assertOk()->assertJsonCount(2);
    }

    // Vérifie que le filtre de niveau ne renvoie que les formations du niveau demandé.
    public function test_list_formations_with_level_filter(): void
    {
        Formation::factory()->create(['level' => 'beginner']);
        Formation::factory()->create(['level' => 'advanced']);

        $reponse = $this->getJson('/api/formations?level=beginner');
        $reponse->assertOk()->assertJsonCount(1);
    }

    // Vérifie qu'un formateur connecté ne voit dans la liste publique que ses propres formations.
    public function test_formateur_sees_only_own_formations_in_public_list(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        Formation::factory()->create(['user_id' => 1, 'titre' => 'Mine']);
        Formation::factory()->create(['user_id' => 99, 'titre' => 'Others']);

        $reponse = $this->withToken('jeton-test')->getJson('/api/formations');
        $reponse->assertOk()->assertJsonCount(1);
    }

    // Vérifie qu'on peut créer une formation avec ses modules en une seule requête.
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

    // Vérifie qu'une mise à jour partielle d'une formation enregistre bien les nouvelles données.
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

    // Vérifie que le détail d'une formation inclut bien la liste de ses modules.
    public function test_show_formation_includes_modules(): void
    {
        $formation = Formation::factory()->create();
        Module::factory()->count(2)->create(['formation_id' => $formation->id]);

        $reponse = $this->getJson("/api/formations/{$formation->id}");
        $reponse->assertOk()->assertJsonStructure(['modules']);
    }

    // Vérifie que la suppression d'une formation supprime aussi ses modules en cascade.
    public function test_delete_formation_also_deletes_modules(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module = Module::factory()->create(['formation_id' => $formation->id]);

        $this->withToken('jeton-test')->deleteJson("/api/formations/{$formation->id}");

        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
    }

    // Vérifie qu'une création avec un niveau non autorisé échoue avec une erreur de validation.
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

    // Vérifie qu'un prix négatif est rejeté par la validation côté serveur.
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
