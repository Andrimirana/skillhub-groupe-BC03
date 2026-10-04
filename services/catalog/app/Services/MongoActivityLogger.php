<?php

/**
 * Fichier : MongoActivityLogger.php
 * Rôle    : Enregistre les événements métier dans MongoDB pour traçabilité et audit.
 * Modifié : 2026-10-04
 */

namespace App\Services;

use Carbon\CarbonImmutable;
use Throwable;

class MongoActivityLogger
{
    /**
     * Insère un document de log dans la collection MongoDB configurée.
     * Si MongoDB est indisponible ou l'URI absente, le log est silencieusement ignoré.
     */
    public function log(string $evenement, array $donnees = []): void
    {
        $manager = $this->manager();

        if ($manager === null) {
            return;
        }

        try {
            // Chaque log inclut automatiquement un horodatage ISO 8601 et un timestamp Unix pour faciliter les tris
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

    /**
     * Recherche des documents dans la collection configurée.
     * Retourne un tableau vide si MongoDB n'est pas disponible.
     */
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

    /**
     * Retourne une connexion MongoDB via l'extension PHP mongodb, ou null si elle n'est pas disponible.
     */
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
