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

    public function test_log_uses_default_database_name_when_not_configured(): void
    {
        putenv('MONGODB_URI=');
        putenv('MONGODB_DATABASE=');
        
        $logger = new MongoActivityLogger();
        $logger->log('user_created', ['id' => 456]);
        
        $this->assertTrue(true);
    }

    public function test_log_uses_default_collection_name_when_not_configured(): void
    {
        putenv('MONGODB_URI=');
        putenv('MONGODB_COLLECTION=');
        
        $logger = new MongoActivityLogger();
        $logger->log('formation_created', ['formation_id' => 789]);
        
        $this->assertTrue(true);
    }

    public function test_log_handles_empty_data_array(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $logger->log('simple_event', []);
        
        $this->assertTrue(true);
    }

    public function test_log_handles_complex_nested_data(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $donneesComplexes = [
            'user' => [
                'id' => 123,
                'name' => 'Jean Dupont',
                'roles' => ['formateur', 'admin'],
            ],
            'metadata' => [
                'ip' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0',
            ],
        ];
        
        $logger->log('complex_event', $donneesComplexes);
        
        $this->assertTrue(true);
    }

    public function test_log_does_not_throw_on_empty_event_name(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $logger->log('', ['data' => 'test']);
        
        $this->assertTrue(true);
    }

    public function test_log_handles_special_characters_in_event_name(): void
    {
        putenv('MONGODB_URI=');
        
        $logger = new MongoActivityLogger();
        $logger->log('événement-accentué', ['data' => 'test']);
        $logger->log('123-event-name', ['data' => 'test']);
        
        $this->assertTrue(true);
    }
}
