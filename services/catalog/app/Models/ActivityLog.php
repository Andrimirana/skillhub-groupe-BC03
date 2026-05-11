<?php

namespace App\Models;

use App\Services\MongoActivityLogger;
use Carbon\CarbonImmutable;

/**
 * Représente un log d'activité MongoDB.
 *
 * Pas un modèle Eloquent : MongoDB n'est pas une base relationnelle.
 * Cette classe est un simple POPO avec quelques helpers statiques pour
 * lire la collection via le client MongoDB officiel.
 */
class ActivityLog
{
    public function __construct(public readonly array $attributs)
    {
    }

    public function toArray(): array
    {
        return $this->attributs;
    }

    /**
     * Récupère les logs d'une formation, du plus récent au plus ancien.
     */
    public static function forCourse(int $courseId, int $limite = 50): array
    {
        $logger = app(MongoActivityLogger::class);
        $client = $logger->client();

        if ($client === null) {
            return [];
        }

        $curseur = $client->selectDatabase($logger->database())
            ->selectCollection($logger->collection())
            ->find(
                ['course_id' => $courseId],
                [
                    'sort'  => ['created_at' => -1, 'timestamp' => -1],
                    'limit' => $limite,
                ],
            );

        $resultats = [];
        foreach ($curseur as $document) {
            $resultats[] = self::normaliserDocument($document);
        }

        return $resultats;
    }

    /**
     * Convertit un BSONDocument MongoDB en tableau PHP utilisable côté API.
     */
    private static function normaliserDocument(mixed $document): array
    {
        $tableau = json_decode(json_encode($document), true) ?: [];

        // Le _id natif de Mongo devient un id sérialisable
        if (isset($tableau['_id']['$oid'])) {
            $tableau['id'] = $tableau['_id']['$oid'];
        }
        unset($tableau['_id']);

        if (isset($tableau['timestamp']) && is_array($tableau['timestamp'])) {
            // Si Mongo a stocké un BSONDate ($date.$numberLong)
            $millisecondes = $tableau['timestamp']['$date']['$numberLong']
                ?? $tableau['timestamp']['$date']
                ?? null;

            if ($millisecondes !== null) {
                $tableau['timestamp'] = CarbonImmutable::createFromTimestampMs((int) $millisecondes)->toIso8601String();
            }
        }

        return $tableau;
    }
}
