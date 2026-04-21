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

    public function test_liste_formations_accessible_sans_connexion(): void
    {
        Formation::factory()->count(3)->create();
        $reponse = $this->getJson('/api/formations');
        $reponse->assertOk()->assertJsonCount(3);
    }

    public function test_afficher_une_formation_incremente_les_vues(): void
    {
        $formation = Formation::factory()->create(['vues' => 0]);
        $this->getJson("/api/formations/{$formation->id}")->assertOk();
        $this->assertDatabaseHas('formations', ['id' => $formation->id, 'vues' => 1]);
    }

    public function test_afficher_formation_retourne_les_bonnes_donnees(): void
    {
        $formation = Formation::factory()->create(['titre' => 'Cours de test']);
        $reponse = $this->getJson("/api/formations/{$formation->id}");
        $reponse->assertOk()->assertJsonPath('titre', 'Cours de test');
    }

    public function test_creer_formation_en_tant_que_formateur(): void
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

    public function test_creer_formation_interdit_pour_apprenant(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->postJson('/api/formations', []);
        $reponse->assertForbidden();
    }

    public function test_modifier_sa_propre_formation(): void
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

    public function test_modifier_formation_dun_autre_formateur_interdit(): void
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

    public function test_supprimer_sa_formation(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formation = Formation::factory()->create(['user_id' => 1]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formation->id}");
        $reponse->assertOk();
        $this->assertDatabaseMissing('formations', ['id' => $formation->id]);
    }

    public function test_supprimer_formation_dun_autre_interdit(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        $formationAutre = Formation::factory()->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->deleteJson("/api/formations/{$formationAutre->id}");
        $reponse->assertForbidden();
    }

    public function test_mes_formations_retourne_uniquement_les_siennes(): void
    {
        $this->simulerConnexion($this->profilFormateur);
        Formation::factory()->count(2)->create(['user_id' => 1]);
        Formation::factory()->count(3)->create(['user_id' => 99]);

        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertOk()->assertJsonCount(2);
    }

    public function test_mes_formations_interdit_pour_apprenant(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        $reponse = $this->withToken('jeton-test')->getJson('/api/my-formations');
        $reponse->assertForbidden();
    }

    public function test_requete_sans_jeton_retourne_401(): void
    {
        $reponse = $this->postJson('/api/formations', []);
        $reponse->assertUnauthorized();
    }
}
