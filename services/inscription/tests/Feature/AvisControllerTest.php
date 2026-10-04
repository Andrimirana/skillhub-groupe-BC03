<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des avis laissés par les apprenants et de la synchronisation du nombre d'apprenants
class AvisControllerTest extends TestCase
{
    use RefreshDatabase;

    private array $profilApprenant = ['id' => 1, 'nom' => 'Bob Martin', 'email' => 'bob@test.com', 'role' => 'apprenant'];
    private int $idFormation = 42;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('log')->andReturn(null);
        });

        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/internal/*'     => Http::response(['ok' => true], 200),
            "*/api/formations/{$this->idFormation}" => Http::response(['id' => $this->idFormation, 'titre' => 'PHP'], 200),
        ]);
    }

    private function creerInscription(array $attributs = []): Enrollment
    {
        return Enrollment::query()->create(array_merge([
            'utilisateur_id'    => 1,
            'formation_id'      => $this->idFormation,
            'progression'       => 0,
            'completed_modules' => [],
            'date_inscription'  => now(),
        ], $attributs));
    }

    // Vérifie qu'un apprenant inscrit peut laisser un avis.
    public function test_learner_can_leave_review(): void
    {
        $this->creerInscription();

        $reponse = $this->withToken('jeton-test')->putJson("/api/formations/{$this->idFormation}/avis", [
            'note'        => 4,
            'commentaire' => 'Très bonne formation',
        ]);

        $reponse->assertOk()
            ->assertJsonPath('note', 4)
            ->assertJsonPath('nom', 'Bob Martin');
        $this->assertDatabaseHas('enrollments', ['formation_id' => $this->idFormation, 'avis_note' => 4]);
    }

    // Vérifie qu'un apprenant non inscrit ne peut pas laisser d'avis.
    public function test_review_requires_enrollment(): void
    {
        $this->withToken('jeton-test')->putJson("/api/formations/{$this->idFormation}/avis", [
            'note'        => 5,
            'commentaire' => 'Super',
        ])->assertNotFound();
    }

    // Vérifie que la note doit être comprise entre 1 et 5.
    public function test_review_note_is_validated(): void
    {
        $this->creerInscription();

        $this->withToken('jeton-test')->putJson("/api/formations/{$this->idFormation}/avis", [
            'note'        => 9,
            'commentaire' => 'Super',
        ])->assertStatus(422);
    }

    // Vérifie que les avis d'une formation sont publics et donnent la moyenne.
    public function test_formation_reviews_with_average(): void
    {
        $this->creerInscription(['utilisateur_id' => 1, 'avis_note' => 4, 'avis_commentaire' => 'Bien', 'avis_date' => now()]);
        $this->creerInscription(['utilisateur_id' => 2, 'avis_note' => 5, 'avis_commentaire' => 'Top', 'avis_date' => now()]);
        $this->creerInscription(['utilisateur_id' => 3]);

        $this->getJson("/api/formations/{$this->idFormation}/avis")
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('moyenne', 4.5)
            ->assertJsonCount(2, 'avis');
    }

    // Vérifie que la liste des avis récents ne contient que les inscriptions notées.
    public function test_recent_reviews(): void
    {
        $this->creerInscription(['avis_note' => 3, 'avis_commentaire' => 'Correct', 'avis_date' => now()]);
        $this->creerInscription(['utilisateur_id' => 2]);

        $this->getJson('/api/avis')->assertOk()->assertJsonCount(1);
    }

    // Vérifie que l'inscription envoie le nombre d'apprenants au service Catalog.
    public function test_enrollment_syncs_learner_count(): void
    {
        $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription")->assertCreated();

        Http::assertSent(fn ($requete) => str_contains($requete->url(), "/api/internal/formations/{$this->idFormation}/apprenants")
            && $requete['apprenants'] === 1
            && $requete->hasHeader('X-Service-Key'));
    }
}
