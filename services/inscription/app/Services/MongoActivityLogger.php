<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Throwable;

class MongoActivityLogger
{
    public function log(string $evenement, array $donnees = []): void
    {
        $manager = $this->manager();

        if ($manager === null) {
            return;
        }

        try {
            $ecriture = new \MongoDB\Driver\BulkWrite();
            $ecriture->insert([
                'event'      => $evenement,
                ...$donnees,
                'timestamp'  => CarbonImmutable::now()->toIso8601String(),
                'created_at' => CarbonImmutable::now()->getTimestampMs(),
            ]);

            $manager->executeBulkWrite($this->espaceDeNoms(), $ecriture);
        } catch (Throwable $e) {
            error_log('[MongoActivityLogger] ' . $e->getMessage());
        }
    }

    public function find(array $filtre, array $options = []): array
    {
        $manager = $this->manager();

        if ($manager === null) {
            return [];
        }

        try {
            $curseur = $manager->executeQuery($this->espaceDeNoms(), new \MongoDB\Driver\Query($filtre, $options));
            $curseur->setTypeMap(['root' => 'array', 'document' => 'array', 'array' => 'array']);

            return $curseur->toArray();
        } catch (Throwable $e) {
            error_log('[MongoActivityLogger] ' . $e->getMessage());

            return [];
        }
    }

    public function manager(): ?\MongoDB\Driver\Manager
    {
        if (! \class_exists(\MongoDB\Driver\Manager::class)) {
            return null;
        }

        $uri = (string) (env('MONGO_URI') ?: env('MONGODB_URI', ''));

        if ($uri === '') {
            return null;
        }

        try {
            return new \MongoDB\Driver\Manager($uri, ['serverSelectionTimeoutMS' => 2000]);
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

    private function espaceDeNoms(): string
    {
        return $this->database() . '.' . $this->collection();
    }
}
