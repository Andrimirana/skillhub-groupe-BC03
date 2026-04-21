<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des endpoints inscription : seuls les apprenants peuvent s'inscrire à une formation
class EnrollmentControllerTest extends TestCase
{
    use RefreshDatabase;

    // Les identifiants formation sont fictifs et validés via le service Catalog mocké
    private array $profilApprenant  = ['id' => 1, 'nom' => 'Bob', 'email' => 'bob@test.com', 'role' => 'apprenant'];
    private array $profilFormateur  = ['id' => 2, 'nom' => 'Alice', 'email' => 'alice@test.com', 'role' => 'formateur'];
    private int   $idFormation      = 42;

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

    private function simulerFormationDisponible(): void
    {
        Http::fake([
            '*/api/validate-token'              => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response(['id' => $this->idFormation, 'titre' => 'PHP avancé'], 200),
        ]);
    }

    public function test_apprenant_peut_sinscrire_a_une_formation(): void
    {
        $this->simulerFormationDisponible();

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertCreated()->assertJsonPath('formation_id', $this->idFormation);
        $this->assertDatabaseHas('enrollments', ['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);
    }

    public function test_inscription_doublon_retourne_meme_enregistrement(): void
    {
        $this->simulerFormationDisponible();

        $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");

        $reponse->assertCreated();
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_formateur_ne_peut_pas_sinscrire(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertForbidden();
    }

    public function test_inscription_formation_introuvable_retourne_404(): void
    {
        Http::fake([
            '*/api/validate-token'              => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response([], 404),
        ]);

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertNotFound();
    }

    public function test_apprenant_peut_se_desinscrire(): void
    {
        $this->simulerConnexion($this->profilApprenant);

        Enrollment::factory()->create([
            'utilisateur_id' => 1,
            'formation_id'   => $this->idFormation,
        ]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertOk();
        $this->assertDatabaseMissing('enrollments', ['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);
    }

    public function test_formateur_ne_peut_pas_se_desinscrire(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertForbidden();
    }

    public function test_apprenant_voit_ses_formations_inscrites(): void
    {
        Http::fake([
            '*/api/validate-token'   => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/formations/*'     => Http::response(['id' => 10, 'titre' => 'Formation test', 'description' => '', 'category' => 'dev', 'date' => null, 'statut' => '', 'price' => 0, 'duration' => 0, 'level' => '', 'vues' => 0, 'apprenants' => 0, 'formateur' => null, 'modules' => []], 200),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 10]);

        $reponse = $this->withToken('jeton-test')->getJson('/api/apprenant/formations');
        $reponse->assertOk()->assertJsonCount(1);
    }

    public function test_apprenant_sans_inscription_retourne_liste_vide(): void
    {
        $this->simulerConnexion($this->profilApprenant);

        $reponse = $this->withToken('jeton-test')->getJson('/api/apprenant/formations');
        $reponse->assertOk()->assertJson([]);
    }

    public function test_formateur_ne_peut_pas_voir_formations_apprenant(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $reponse = $this->withToken('jeton-test')->getJson('/api/apprenant/formations');
        $reponse->assertForbidden();
    }

    public function test_requete_sans_jeton_retourne_401(): void
    {
        $reponse = $this->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse->assertUnauthorized();
    }
}
