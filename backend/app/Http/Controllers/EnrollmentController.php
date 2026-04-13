<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Formation;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    public function store(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateur = $requete->user();

        if ($utilisateur->role !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent s\'inscrire à une formation.'], 403);
        }

        $inscription = Enrollment::query()->firstOrCreate([
            'utilisateur_id' => $utilisateur->id,
            'formation_id' => $formation->id,
        ], [
            'progression' => 0,
            'date_inscription' => now(),
        ]);

        $this->mongoLogger->log('course_enrollment', [
            'user_id' => $utilisateur->id,
            'course_id' => $formation->id,
        ]);

        return response()->json([
            'id' => $inscription->id,
            'utilisateur_id' => $inscription->utilisateur_id,
            'formation_id' => $inscription->formation_id,
            'progression' => $inscription->progression,
            'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
        ], 201);
    }

    public function destroy(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateur = $requete->user();

        if ($utilisateur->role !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent se désinscrire.'], 403);
        }

        Enrollment::query()
            ->where('utilisateur_id', $utilisateur->id)
            ->where('formation_id', $formation->id)
            ->delete();

        return response()->json(['message' => 'Désinscription effectuée.']);
    }

    public function myCourses(Request $requete): JsonResponse
    {
        $utilisateur = $requete->user();

        if ($utilisateur->role !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent accéder à cette ressource.'], 403);
        }

        $formations = Formation::query()
            ->withCount('inscriptions')
            ->with(['formateur:id,name', 'modules:id,formation_id,titre,contenu,ordre'])
            ->whereHas('inscriptions', function ($query) use ($utilisateur): void {
                $query->where('utilisateur_id', $utilisateur->id);
            })
            ->orderByDesc('date')
            ->get()
            ->map(function (Formation $formation) use ($utilisateur): array {
                $inscription = Enrollment::query()
                    ->where('utilisateur_id', $utilisateur->id)
                    ->where('formation_id', $formation->id)
                    ->first();

                return [
                    'id' => $formation->id,
                    'titre' => $formation->titre,
                    'description' => $formation->description,
                    'category' => $formation->category,
                    'date' => optional($formation->date)->format('Y-m-d'),
                    'statut' => $formation->statut,
                    'price' => (float) $formation->price,
                    'duration' => $formation->duration,
                    'level' => $formation->level,
                    'vues' => $formation->vues,
                    'apprenants' => $formation->inscriptions_count,
                    'formateur' => $formation->formateur?->name,
                    'progression' => $inscription?->progression ?? 0,
                    'modules' => $formation->modules->map(fn ($module) => [
                        'id' => $module->id,
                        'titre' => $module->titre,
                        'contenu' => $module->contenu,
                        'ordre' => $module->ordre,
                    ])->values(),
                ];
            });

        return response()->json($formations);
    }
}
