<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Throwable;

class MongoActivityLogger
{
    public function log(string $evenement, array $donnees = []): void
    {
        $client = $this->client();

        if ($client === null) {
            return;
        }

        try {
            $client->selectDatabase($this->database())
                ->selectCollection($this->collection())
                ->insertOne([
                    'event'      => $evenement,
                    ...$donnees,
                    'timestamp'  => CarbonImmutable::now()->toIso8601String(),
                    'created_at' => CarbonImmutable::now()->getTimestampMs(),
                ]);
        } catch (Throwable $e) {
            error_log('[MongoActivityLogger] ' . $e->getMessage());
        }
    }

    public function client(): ?\MongoDB\Client
    {
        if (! \class_exists(\MongoDB\Client::class)) {
            return null;
        }

        $uri = (string) (env('MONGO_URI') ?: env('MONGODB_URI', ''));

        if ($uri === '') {
            return null;
        }

        try {
            return new \MongoDB\Client($uri);
        } catch (Throwable $e) {
            error_log('[MongoActivityLogger] connexion impossible : ' . $e->getMessage());

            return null;
        }
    }

    public function database(): string
    {
        return (string) (env('MONGO_DATABASE') ?: env('MONGODB_DATABASE', 'skillhub_logs'));
    }

    public function collection(): string
    {
        return (string) (env('MONGO_COLLECTION') ?: env('MONGODB_COLLECTION', 'activity_logs'));
    }
}
