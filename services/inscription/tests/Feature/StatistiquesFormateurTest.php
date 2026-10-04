<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Tests des statistiques affichées sur le tableau de bord formateur
class StatistiquesFormateurTest extends TestCase
{
    use RefreshDatabase;

    private int $idFormation = 42;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('log')->andReturn(null);
        });
    }

    private function simulerConnexion(string $role): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => ['id' => 9, 'nom' => 'Prof', 'role' => $role]], 200),
        ]);
    }

    private function creerInscription(array $attributs): Enrollment
    {
        return Enrollment::query()->create(array_merge([
            'formation_id'      => $this->idFormation,
            'progression'       => 0,
            'completed_modules' => [],
            'date_inscription'  => now(),
        ], $attributs));
    }

    // Vérifie les statistiques renvoyées au formateur pour ses formations.
    public function test_trainer_statistics(): void
    {
        $this->simulerConnexion('formateur');
        $this->creerInscription(['utilisateur_id' => 1, 'utilisateur_nom' => 'Alice', 'progression' => 100, 'avis_note' => 5, 'avis_date' => now()]);
        $this->creerInscription(['utilisateur_id' => 2, 'utilisateur_nom' => 'Bob', 'progression' => 50]);

        $this->withToken('jeton-test')->getJson("/api/formateur/statistiques?ids={$this->idFormation},999")
            ->assertOk()
            ->assertJsonPath('formations.0.inscrits', 2)
            ->assertJsonPath('formations.0.progression_moyenne', 75)
            ->assertJsonPath('formations.0.termines', 1)
            ->assertJsonPath('formations.1.inscrits', 0)
            ->assertJsonCount(2, 'inscriptions_recentes');
    }

    // Vérifie qu'un apprenant ne peut pas consulter les statistiques formateur.
    public function test_learner_cannot_read_trainer_statistics(): void
    {
        $this->simulerConnexion('apprenant');

        $this->withToken('jeton-test')->getJson("/api/formateur/statistiques?ids={$this->idFormation}")
            ->assertForbidden();
    }
}
