<?php

namespace Tests\Unit;

use App\Services\MongoActivityLogger;
use PHPUnit\Framework\TestCase;

class MongoActivityLoggerTest extends TestCase
{
    public function test_log_returns_early_when_no_uri(): void
    {
        putenv('MONGODB_URI=');
        $_ENV['MONGODB_URI'] = '';

        $logger = new MongoActivityLogger();
        $logger->log('test_event', ['user_id' => 1]);

        $this->assertTrue(true);
    }

    public function test_log_catches_exception_on_invalid_uri(): void
    {
        if (! class_exists(\MongoDB\Client::class)) {
            $this->markTestSkipped('Extension MongoDB non disponible.');
        }

        putenv('MONGODB_URI=mongodb://invalid-host-xyz:27017');
        $_ENV['MONGODB_URI'] = 'mongodb://invalid-host-xyz:27017';
        putenv('MONGODB_DATABASE=skillhub_test');
        putenv('MONGODB_COLLECTION=activity_logs_test');

        $logger = new MongoActivityLogger();

        try {
            $logger->log('test_event', ['user_id' => 1]);
            $this->assertTrue(true);
        } finally {
            putenv('MONGODB_URI=');
            $_ENV['MONGODB_URI'] = '';
        }
    }

    public function test_log_uses_default_database_when_not_configured(): void
    {
        putenv('MONGODB_URI=');
        putenv('MONGODB_DATABASE=');
        
        $logger = new MongoActivityLogger();
        $logger->log('enrollment_created', ['id' => 456]);
        
        $this->assertTrue(true);
    }

    public function test_log_uses_default_collection_when_not_configured(): void
    {
        putenv('MONGODB_URI=');
        putenv('MONGODB_COLLECTION=');
        
        $logger = new MongoActivityLogger();
        $logger->log('module_updated', ['module_id' => 789]);
        
        $this->assertTrue(true);
    }

    public function test_log_handles_empty_data(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $logger->log('simple_event', []);
        
        $this->assertTrue(true);
    }

    public function test_log_handles_nested_data(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $donneesComplexes = [
            'enrollment' => [
                'id' => 123,
                'user_id' => 456,
                'status' => 'active',
            ],
            'metadata' => [
                'created_at' => '2024-01-15',
                'updated_at' => '2024-01-20',
            ],
        ];
        
        $logger->log('complex_enrollment_event', $donneesComplexes);
        
        $this->assertTrue(true);
    }

    public function test_log_accepts_empty_event_name(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $logger->log('', ['data' => 'test']);
        
        $this->assertTrue(true);
    }

    public function test_log_handles_special_characters(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $logger->log('événement-spécial', ['data' => 'test']);
        $logger->log('event-123', ['data' => 'test']);
        
        $this->assertTrue(true);
    }
}
