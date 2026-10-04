<?php

namespace Tests\Feature;

use App\Services\MongoActivityLogger;
use Tests\TestCase;

/**
 * Vérifie la récupération des logs d'activité MongoDB par formation
 */
class ActivityLogControllerTest extends TestCase
{
    // Vérifie que les logs d'une formation sont renvoyés avec un id lisible.
    public function test_get_activity_logs_for_formation(): void
    {
        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('find')
                ->once()
                ->with(['course_id' => 1], \Mockery::on(fn ($options) => $options['limit'] === 50))
                ->andReturn([
                    ['_id' => ['$oid' => 'abc123'], 'event' => 'course_viewed', 'course_id' => 1, 'timestamp' => '2026-10-04T10:00:00+00:00'],
                    ['_id' => ['$oid' => 'def456'], 'event' => 'course_created', 'course_id' => 1, 'timestamp' => '2026-10-03T10:00:00+00:00'],
                ]);
        });

        $reponse = $this->getJson('/api/formations/1/logs');

        $reponse->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', 'abc123')
            ->assertJsonPath('0.event', 'course_viewed')
            ->assertJsonStructure(['*' => ['id', 'event', 'course_id', 'timestamp']]);
    }

    // Vérifie qu'une formation sans log renvoie un tableau vide.
    public function test_returns_empty_array_when_no_logs(): void
    {
        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('find')->andReturn([]);
        });

        $this->getJson('/api/formations/999/logs')->assertOk()->assertJsonCount(0);
    }
}
