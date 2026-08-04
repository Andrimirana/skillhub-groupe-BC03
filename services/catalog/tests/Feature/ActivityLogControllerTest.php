<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Services\MongoActivityLogger;
use Tests\TestCase;

class ActivityLogControllerTest extends TestCase
{
    public function test_activity_logs_route_returns_empty_array_without_mongo_client(): void
    {
        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('client')->andReturn(null);
        });

        $response = $this->getJson('/api/formations/999/logs');

        $response->assertOk()->assertJsonCount(0);
    }

    public function test_activity_log_model_returns_empty_array_without_mongo_client(): void
    {
        $this->mock(MongoActivityLogger::class, function ($simulateur): void {
            $simulateur->shouldReceive('client')->andReturn(null);
        });

        $this->assertSame([], ActivityLog::forCourse(1));
    }
}
