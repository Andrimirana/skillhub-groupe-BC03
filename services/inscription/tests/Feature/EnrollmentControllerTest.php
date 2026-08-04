<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EnrollmentControllerTest extends TestCase
{
    use RefreshDatabase;

    private array $profilApprenant = ['id' => 1, 'nom' => 'Bob', 'email' => 'bob@test.com', 'role' => 'apprenant'];
    private array $profilFormateur = ['id' => 2, 'nom' => 'Alice', 'email' => 'alice@test.com', 'role' => 'formateur'];
    private int $idFormation = 42;

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
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response([
                'id' => $this->idFormation,
                'titre' => 'PHP avancé',
                'statut' => 'Publié',
            ], 200),
        ]);
    }

    public function test_learner_can_enroll(): void
    {
        $this->simulerFormationDisponible();

        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");

        $reponse->assertCreated()->assertJsonPath('formation_id', $this->idFormation);
        $this->assertDatabaseHas('enrollments', ['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);
    }

    public function test_duplicate_enrollment_returns_same(): void
    {
        $this->simulerFormationDisponible();

        $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");
        $reponse = $this->withToken('jeton-test')->postJson("/api/formations/{$this->idFormation}/inscription");

        $reponse->assertCreated();
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_trainer_cannot_enroll(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription")
            ->assertForbidden();
    }

    public function test_enroll_not_found_returns_404(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response([], 404),
        ]);

        $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription")
            ->assertNotFound();
    }

    public function test_learner_cannot_enroll_unpublished_formation(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response([
                'id' => $this->idFormation,
                'titre' => 'Brouillon',
                'statut' => 'Brouillon',
            ], 200),
        ]);

        $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription")
            ->assertNotFound();
        $this->assertDatabaseMissing('enrollments', ['formation_id' => $this->idFormation]);
    }

    public function test_learner_can_unenroll(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);

        $this->withToken('jeton-test')
            ->deleteJson("/api/formations/{$this->idFormation}/inscription")
            ->assertOk();
        $this->assertDatabaseMissing('enrollments', ['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);
    }

    public function test_trainer_cannot_unenroll(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $this->withToken('jeton-test')
            ->deleteJson("/api/formations/{$this->idFormation}/inscription")
            ->assertForbidden();
    }

    public function test_learner_sees_enrollments(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/formations/*' => Http::response($this->formationApi(10), 200),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 10]);

        $this->withToken('jeton-test')
            ->getJson('/api/apprenant/formations')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_learner_no_enrollment_returns_empty(): void
    {
        $this->simulerConnexion($this->profilApprenant);

        $this->withToken('jeton-test')->getJson('/api/apprenant/formations')
            ->assertOk()
            ->assertJson([]);
    }

    public function test_trainer_cannot_view_enrollments(): void
    {
        $this->simulerConnexion($this->profilFormateur);

        $this->withToken('jeton-test')
            ->getJson('/api/apprenant/formations')
            ->assertForbidden();
    }

    public function test_no_token_returns_401(): void
    {
        $this->postJson("/api/formations/{$this->idFormation}/inscription")->assertUnauthorized();
    }

    public function test_enrollment_stores_progression_default_zero(): void
    {
        $this->simulerFormationDisponible();

        $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription")
            ->assertCreated()
            ->assertJsonPath('progression', 0);
    }

    public function test_enrollment_stores_date_inscription(): void
    {
        $this->simulerFormationDisponible();

        $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription")
            ->assertCreated()
            ->assertJsonStructure(['date_inscription']);
    }

    public function test_unenroll_non_existing_enrollment_succeeds(): void
    {
        $this->simulerConnexion($this->profilApprenant);

        $this->withToken('jeton-test')
            ->deleteJson('/api/formations/999/inscription')
            ->assertOk();
    }

    public function test_my_courses_with_multiple_formations(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/formations/10' => Http::response($this->formationApi(10, 'Formation A'), 200),
            '*/api/formations/20' => Http::response($this->formationApi(20, 'Formation B'), 200),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 10]);
        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 20]);

        $this->withToken('jeton-test')
            ->getJson('/api/apprenant/formations')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_my_courses_includes_progression(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/formations/10' => Http::response($this->formationApi(10), 200),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 10, 'progression' => 75]);

        $this->withToken('jeton-test')
            ->getJson('/api/apprenant/formations')
            ->assertOk()
            ->assertJsonPath('0.progression', 75);
    }

    public function test_progression_ignores_unknown_or_non_sequential_lessons(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            "*/api/formations/{$this->idFormation}" => Http::response($this->formationAvecLecons(), 200),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => $this->idFormation, 'progression' => 0]);

        $this->withToken('jeton-test')
            ->putJson("/api/formations/{$this->idFormation}/progression", [
                'completed_modules' => ['10:lesson:0', 'cle-inventee', '20:lesson:1'],
                'last_lesson_key' => 'cle-inventee',
            ])
            ->assertOk()
            ->assertJsonPath('progression', 25)
            ->assertJsonPath('completed_modules', ['10:lesson:0'])
            ->assertJsonPath('last_lesson_key', '10:lesson:0');
    }

    public function test_my_courses_handles_deleted_formation(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $this->profilApprenant], 200),
            '*/api/formations/999' => Http::response([], 404),
        ]);

        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => 999]);

        $this->withToken('jeton-test')
            ->getJson('/api/apprenant/formations')
            ->assertOk()
            ->assertJsonPath('0.titre', 'Formation introuvable');
    }

    public function test_enroll_returns_201_status(): void
    {
        $this->simulerFormationDisponible();

        $this->withToken('jeton-test')
            ->postJson("/api/formations/{$this->idFormation}/inscription")
            ->assertStatus(201);
    }

    public function test_unenroll_returns_success_message(): void
    {
        $this->simulerConnexion($this->profilApprenant);
        Enrollment::factory()->create(['utilisateur_id' => 1, 'formation_id' => $this->idFormation]);

        $this->withToken('jeton-test')
            ->deleteJson("/api/formations/{$this->idFormation}/inscription")
            ->assertOk()
            ->assertJsonStructure(['message']);
    }

    private function formationApi(int $id, string $titre = 'Formation test'): array
    {
        return [
            'id' => $id,
            'titre' => $titre,
            'description' => '',
            'category' => 'dev',
            'date' => null,
            'statut' => 'Publié',
            'duration' => 0,
            'level' => '',
            'vues' => 0,
            'apprenants' => 0,
            'formateur' => null,
            'modules' => [],
        ];
    }

    private function formationAvecLecons(): array
    {
        return [
            ...$this->formationApi($this->idFormation, 'Formation sécurisée'),
            'modules' => [
                [
                    'id' => 10,
                    'titre' => 'Module 1',
                    'contenu' => json_encode(['lessons' => [['titre' => 'A'], ['titre' => 'B']]]),
                ],
                [
                    'id' => 20,
                    'titre' => 'Module 2',
                    'contenu' => json_encode(['lessons' => [['titre' => 'C'], ['titre' => 'D']]]),
                ],
            ],
        ];
    }
}
