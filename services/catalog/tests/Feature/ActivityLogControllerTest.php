<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests pour ActivityLogController
 * Vérifie la récupération des logs d'activité MongoDB par formation
 */
class ActivityLogControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_activity_logs_for_formation(): void
    {
        // Créer 5 logs pour la formation ID 1
        ActivityLog::factory()->count(5)->create(['course_id' => 1]);
        
        // Créer 3 logs pour une autre formation (ne doivent pas apparaître)
        ActivityLog::factory()->count(3)->create(['course_id' => 2]);

        $response = $this->getJson('/api/formations/1/activity-logs');

        $response->assertOk()
            ->assertJsonCount(5)
            ->assertJsonStructure([
                '*' => ['course_id', 'action', 'timestamp']
            ]);
    }

    public function test_activity_logs_limited_to_50(): void
    {
        // Créer 60 logs pour tester la limite de 50
        ActivityLog::factory()->count(60)->create(['course_id' => 1]);

        $response = $this->getJson('/api/formations/1/activity-logs');

        $response->assertOk()
            ->assertJsonCount(50); // Vérifie la limite à 50
    }

    public function test_activity_logs_ordered_by_most_recent(): void
    {
        // Créer des logs avec des timestamps différents
        $oldLog = ActivityLog::factory()->create([
            'course_id' => 1,
            'timestamp' => now()->subDays(2),
            'action' => 'old_action'
        ]);

        $recentLog = ActivityLog::factory()->create([
            'course_id' => 1,
            'timestamp' => now(),
            'action' => 'recent_action'
        ]);

        $response = $this->getJson('/api/formations/1/activity-logs');

        $response->assertOk();
        
        $logs = $response->json();
        
        // Le premier log doit être le plus récent
        $this->assertEquals('recent_action', $logs[0]['action']);
        $this->assertEquals('old_action', $logs[1]['action']);
    }

    public function test_activity_logs_returns_empty_array_for_formation_without_logs(): void
    {
        $response = $this->getJson('/api/formations/999/activity-logs');

        $response->assertOk()
            ->assertJsonCount(0);
    }

    public function test_activity_logs_filters_by_course_id_correctly(): void
    {
        // Créer logs pour différentes formations
        ActivityLog::factory()->create(['course_id' => 1, 'action' => 'course_1_action']);
        ActivityLog::factory()->create(['course_id' => 2, 'action' => 'course_2_action']);
        ActivityLog::factory()->create(['course_id' => 1, 'action' => 'course_1_action_2']);

        $response = $this->getJson('/api/formations/1/activity-logs');

        $response->assertOk()
            ->assertJsonCount(2);
        
        $logs = $response->json();
        
        // Vérifier que tous les logs retournés sont pour course_id = 1
        foreach ($logs as $log) {
            $this->assertEquals(1, $log['course_id']);
        }
    }
}
