<?php

/**
 * Fichier : ActivityLogController.php
 * Rôle    : Expose les logs d'activité MongoDB d'une formation via l'API REST.
 * Modifié : 2026-05-08
 */

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;

class ActivityLogController extends Controller
{
    /**
     * Retourne les 50 derniers logs d'une formation, triés du plus récent au plus ancien.
     * La limite à 50 évite de surcharger la réponse sur les formations très actives.
     */
    public function getByFormation(int $formationId): JsonResponse
    {
        $logs = ActivityLog::forCourse($formationId, 50);

        return response()->json($logs);
    }
}
