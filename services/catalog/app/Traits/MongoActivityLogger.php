<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Trait MongoActivityLogger
 * Facilite l'enregistrement des activités utilisateur dans MongoDB
 */
trait MongoActivityLogger
{
    /**
     * Enregistre une activité utilisateur dans MongoDB
     *
     * @param string $action Type d'action (login, formation_view, etc)
     * @param array $details Données additionnelles
     * @return void
     */
    public static function logActivity(string $action, array $details = [])
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                Log::warning('Tentative de log sans utilisateur authentifié');
                return;
            }

            // Construire les données

            $activityData = [
                'userId' => (string) $user->id,
                'userEmail' => $user->email,
                'action' => $action,
                'resourceType' => $details['resourceType'] ?? null,
                'resourceId' => $details['resourceId'] ?? null,
                'resourceTitle' => $details['resourceTitle'] ?? null,
                'details' => $details['metadata'] ?? null,
                'timestamp' => now(),
                'ipAddress' => request()->ip(),
                'userAgent' => request()->userAgent(),
                'duration' => $details['duration'] ?? null,
            ];

            // Enregistrer dans MongoDB via Eloquent
            \App\Models\ActivityLog::create($activityData);

            Log::info("Activité enregistrée: {$action}", ['user' => $user->id]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de l\'activité', [
                'error' => $e->getMessage(),
                'action' => $action
            ]);
        }
    }

    /**
     * Enregistre une formation consultée
     *
     * @param int $formationId
     * @param string $formationTitle
     * @return void
     */
    public static function logFormationView(int $formationId, string $formationTitle)
    {
        self::logActivity('formation_view', [
            'resourceType' => 'formation',
            'resourceId' => $formationId,
            'resourceTitle' => $formationTitle,
        ]);
    }

    /**
     * Enregistre un module complété
     *
     * @param int $formationId
     * @param int $moduleId
     * @param string $moduleTitle
     * @param float $score Score optionnel
     * @return void
     */
    public static function logModuleComplete(int $formationId, int $moduleId, string $moduleTitle, float $score = null)
    {
        $metadata = [];
        if ($score !== null) {
            $metadata['score'] = $score;
        }

        self::logActivity('module_complete', [
            'resourceType' => 'module',
            'resourceId' => $moduleId,
            'resourceTitle' => $moduleTitle,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Enregistre une connexion utilisateur
     *
     * @return void
     */
    public static function logLogin()
    {
        self::logActivity('login', [
            'metadata' => ['loginTime' => now()]
        ]);
    }

    /**
     * Enregistre une déconnexion utilisateur
     *
     * @return void
     */
    public static function logLogout()
    {
        self::logActivity('logout', [
            'metadata' => ['logoutTime' => now()]
        ]);
    }

    /**
     * Enregistre un téléchargement de ressource
     *
     * @param string $resourceType Type de ressource
     * @param int $resourceId ID de la ressource
     * @param string $resourceTitle Titre de la ressource
     * @return void
     */
    public static function logResourceDownload(string $resourceType, int $resourceId, string $resourceTitle)
    {
        self::logActivity('resource_download', [
            'resourceType' => $resourceType,
            'resourceId' => $resourceId,
            'resourceTitle' => $resourceTitle,
        ]);
    }

    /**
     * Enregistre une soumission d'évaluation
     *
     * @param int $formationId
     * @param string $formationTitle
     * @param float $rating Note (1-5)
     * @param string $comment Commentaire optionnel
     * @return void
     */
    public static function logRatingSubmitted(int $formationId, string $formationTitle, float $rating, string $comment = null)
    {
        $metadata = ['rating' => $rating];
        if ($comment) {
            $metadata['comment'] = $comment;
        }

        self::logActivity('rating_submitted', [
            'resourceType' => 'formation',
            'resourceId' => $formationId,
            'resourceTitle' => $formationTitle,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Enregistre la génération d'un certificat
     *
     * @param int $formationId
     * @param string $formationTitle
     * @param string $certificateNumber
     * @return void
     */
    public static function logCertificateGenerated(int $formationId, string $formationTitle, string $certificateNumber)
    {
        self::logActivity('certificate_generated', [
            'resourceType' => 'formation',
            'resourceId' => $formationId,
            'resourceTitle' => $formationTitle,
            'metadata' => ['certificateNumber' => $certificateNumber],
        ]);
    }
}
