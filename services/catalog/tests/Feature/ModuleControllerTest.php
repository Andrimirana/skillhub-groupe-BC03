<?php

namespace Tests\Feature;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des endpoints modules : ajout, modification et suppression par le formateur propriétaire
class ModuleControllerTest extends TestCase
{
    use RefreshDatabase;

    // Le formateur doit posséder la formation pour gérer ses modules
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

    // Vérifie que la liste des modules d'une formation renvoie tous ses modules.
    public function test_list_modules(): void
    {
        $formation = Formation::factory()->create();
        Module::factory()->count(3)->create(['formation_id' => $formation->id]);

        $reponse = $this->getJson("/api/formations/{$formation->id}/modules");
        $reponse->assertOk()->assertJsonCount(3);
    }

    // Vérifie que le formateur propriétaire de la formation peut y ajouter un module.
    public function test_add_module_as_owner(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $donneesModule = ['titre' => 'Introduction', 'contenu' => 'Contenu de présentation'];

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", $donneesModule);
        $reponse->assertCreated()->assertJsonPath('titre', 'Introduction');
        $this->assertDatabaseHas('modules', ['titre' => 'Introduction', 'formation_id' => $formation->id]);
    }

    // Vérifie qu'un formateur ne peut pas ajouter un module à la formation d'un autre formateur.
    public function test_add_module_other_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formationAutre->id}/modules", [
            'titre'   => 'Tentative',
            'contenu' => 'Contenu non autorisé',
        ]);

        $reponse->assertForbidden();
    }

    // Vérifie qu'un apprenant ne peut pas ajouter un module à une formation.
    public function test_add_module_forbidden_for_learner(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", [
            'titre'   => 'Tentative',
            'contenu' => 'x',
        ]);

        $reponse->assertForbidden();
    }

    // Vérifie que le formateur peut modifier un module de sa propre formation.
    public function test_update_own_module(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module    = Module::factory()->create(['formation_id' => $formation->id]);

        $donneesMaj = ['titre' => 'Titre modifié', 'contenu' => 'Nouveau contenu', 'ordre' => 2];

        $reponse = $this->withToken('jeton-test')->putJson("/api/modules/{$module->id}", $donneesMaj);
        $reponse->assertOk()->assertJsonPath('titre', 'Titre modifié');
    }

    // Vérifie qu'un formateur ne peut pas modifier un module appartenant à une autre formation.
    public function test_update_other_module_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);
        $module         = Module::factory()->create(['formation_id' => $formationAutre->id]);

        $reponse = $this->withToken('jeton-test')->putJson("/api/modules/{$module->id}", [
            'titre'   => 'Hack',
            'contenu' => 'x',
            'ordre'   => 1,
        ]);

        $reponse->assertForbidden();
    }

    // Vérifie que le formateur peut supprimer un module de sa propre formation.
    public function test_delete_own_module(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module    = Module::factory()->create(['formation_id' => $formation->id]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/modules/{$module->id}");
        $reponse->assertOk();
        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
    }

    // Vérifie qu'un formateur ne peut pas supprimer un module d'une formation qu'il ne possède pas.
    public function test_delete_other_module_forbidden(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);
        $module         = Module::factory()->create(['formation_id' => $formationAutre->id]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/modules/{$module->id}");
        $reponse->assertForbidden();
    }

    // Vérifie qu'un module créé avec un ordre personnalisé conserve cette valeur.
    public function test_add_module_with_custom_ordre(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $data = ['titre' => 'Custom Order Module', 'contenu' => 'Content', 'ordre' => 5];

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", $data);
        $reponse->assertCreated()->assertJsonPath('ordre', 5);
    }

    // Vérifie que l'ordre est calculé automatiquement si non fourni à la création du module.
    public function test_add_module_without_ordre_sets_auto_increment(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        Module::factory()->create(['formation_id' => $formation->id, 'ordre' => 3]);

        $data = ['titre' => 'Auto Order', 'contenu' => 'Content'];

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", $data);
        $reponse->assertCreated()->assertJsonPath('ordre', 4);
    }

    // Vérifie que la création d'un module sans titre échoue avec une erreur de validation.
    public function test_module_validation_requires_titre(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $data = ['contenu' => 'Content without title'];

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", $data);
        $reponse->assertStatus(422)->assertJsonValidationErrors(['titre']);
    }

    // Vérifie que la création d'un module sans contenu échoue avec une erreur de validation.
    public function test_module_validation_requires_contenu(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $data = ['titre' => 'Title without content'];

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$formation->id}/modules", $data);
        $reponse->assertStatus(422)->assertJsonValidationErrors(['contenu']);
    }

    // Vérifie que la mise à jour d'un module enregistre bien le nouvel ordre.
    public function test_update_module_changes_ordre(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module = Module::factory()->create(['formation_id' => $formation->id, 'ordre' => 1]);

        $data = ['titre' => 'Updated', 'contenu' => 'Updated content', 'ordre' => 10];

        $reponse = $this->withToken('jeton-test')->putJson("/api/modules/{$module->id}", $data);
        $reponse->assertOk()->assertJsonPath('ordre', 10);
    }

    // Vérifie qu'une formation sans modules renvoie une liste vide sans erreur.
    public function test_list_modules_returns_empty_array_for_formation_without_modules(): void
    {
        $formation = Formation::factory()->create();

        $reponse = $this->getJson("/api/formations/{$formation->id}/modules");
        $reponse->assertOk()->assertJsonCount(0);
    }

    // Vérifie qu'un apprenant ne peut pas modifier un module et reçoit un 403.
    public function test_update_module_as_learner_forbidden(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module = Module::factory()->create(['formation_id' => $formation->id]);

        $reponse = $this->withToken('jeton-test')->putJson("/api/modules/{$module->id}", [
            'titre' => 'Attempt',
            'contenu' => 'x',
            'ordre' => 1
        ]);
        $reponse->assertForbidden();
    }

    // Vérifie qu'un apprenant ne peut pas supprimer un module et reçoit un 403.
    public function test_delete_module_as_learner_forbidden(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $formation = Formation::factory()->create(['user_id' => 1]);
        $module = Module::factory()->create(['formation_id' => $formation->id]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/modules/{$module->id}");
        $reponse->assertForbidden();
    }
}
