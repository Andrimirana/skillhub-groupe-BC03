<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Retourne les logs d'activité pour une formation donnée
     *
     * @param Request $request
     * @param int $formationId
     * @return JsonResponse
     */
    public function getByFormation(Request $request, int $formationId): JsonResponse
    {
        // On récupère les logs liés à la formation (course_id)
        $logs = ActivityLog::where('course_id', $formationId)
            ->orderByDesc('timestamp')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }
}
