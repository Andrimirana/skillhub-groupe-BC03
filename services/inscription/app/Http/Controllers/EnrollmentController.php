<?php

/**
 * Fichier : EnrollmentController.php
 * Rôle    : Gère les inscriptions des apprenants aux formations (inscription, désinscription, liste).
 * Modifié : 2026-04-21
 */

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class EnrollmentController extends Controller
{
    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    // Inscription à une formation. Seuls les apprenants peuvent s'inscrire. Vérifie l'existence de la formation auprès du service Catalog avant de créer l'inscription. Enregistre l'activité d'inscription dans MongoDB.

    public function store(Request $requete, int $idFormation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => "Seuls les apprenants peuvent s'inscrire à une formation."], 403);
        }

        // La formation est vérifiée auprès du service Catalog avant toute inscription
        $urlCatalog     = config('services.catalog.url');
        $reponseApi     = Http::get("{$urlCatalog}/api/formations/{$idFormation}");

        if (! $reponseApi->ok()) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        if (! in_array($reponseApi->json('statut'), ['Publié', 'published'], true)) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        $inscription = Enrollment::query()->firstOrCreate([
            'utilisateur_id' => $utilisateurAuth['id'],
            'formation_id'   => $idFormation,
        ], [
            'progression'      => 0,
            'completed_modules'=> [],
            'last_lesson_key'  => null,
            'date_inscription' => now(),
        ]);


        // Enregistrement de l'activité d'inscription dans MongoDB
        $this->mongoLogger->log('course_enrollment', [
            'user_id'   => $utilisateurAuth['id'],
            'course_id' => $idFormation,
        ]);

        return response()->json([
            'id'               => $inscription->id,
            'utilisateur_id'   => $inscription->utilisateur_id,
            'formation_id'     => $inscription->formation_id,
            'progression'      => $inscription->progression,
            'completed_modules'=> $inscription->completed_modules ?? [],
            'last_lesson_key'  => $inscription->last_lesson_key,
            'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
        ], 201);
    }

    // Désinscription d'une formation. Seuls les apprenants peuvent se désinscrire. Supprime l'inscription de la base de données.
    public function destroy(Request $requete, int $idFormation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent se désinscrire.'], 403);
        }

        Enrollment::query()
            ->where('utilisateur_id', $utilisateurAuth['id'])
            ->where('formation_id', $idFormation)
            ->delete();

        return response()->json(['message' => 'Désinscription effectuée.']);
    }

    public function myCourses(Request $requete): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent accéder à cette ressource.'], 403);
        }

        $inscriptions = Enrollment::query()
            ->where('utilisateur_id', $utilisateurAuth['id'])
            ->orderByDesc('date_inscription')
            ->get();

        if ($inscriptions->isEmpty()) {
            return response()->json([]);
        }

        // Les détails de chaque formation sont récupérés individuellement depuis le service Catalog
        $urlCatalog   = config('services.catalog.url');
        $idsFormation = $inscriptions->pluck('formation_id')->unique()->values()->all();

        $formations = collect();
        foreach ($idsFormation as $id) {
            $reponseApi = Http::get("{$urlCatalog}/api/formations/{$id}");
            if ($reponseApi->ok()) {
                $formations->put($id, $reponseApi->json());
            }
        }


        // Combinaison des données d'inscription et de formation pour la réponse finale
        $resultat = $inscriptions->map(function (Enrollment $inscription) use ($formations): array {
            $formation = $formations->get($inscription->formation_id, []);

            return [
                'id'               => $formation['id'] ?? $inscription->formation_id,
                'titre'            => $formation['titre'] ?? 'Formation introuvable',
                'description'      => $formation['description'] ?? '',
                'category'         => $formation['category'] ?? '',
                'date'             => $formation['date'] ?? null,
                'statut'           => $formation['statut'] ?? '',
                'duration'         => $formation['duration'] ?? 0,
                'level'            => $formation['level'] ?? '',
                'image_url'        => $formation['image_url'] ?? null,
                'vues'             => $formation['vues'] ?? 0,
                'apprenants'       => $formation['apprenants'] ?? 0,
                'formateur'        => $formation['formateur'] ?? null,
                'modules'          => $formation['modules'] ?? [],
                'progression'      => $inscription->progression,
                'completed_modules'=> $inscription->completed_modules ?? [],
                'last_lesson_key'  => $inscription->last_lesson_key,
                'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
            ];
        });

        return response()->json($resultat->values());
    }

    public function updateProgress(Request $requete, int $idFormation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent mettre à jour leur progression.'], 403);
        }

        $donneesValidees = $requete->validate([
            'completed_modules'    => ['nullable', 'array'],
            'completed_modules.*'  => ['string', 'max:255'],
            'last_lesson_key'      => ['nullable', 'string', 'max:255'],
        ]);

        $inscription = Enrollment::query()
            ->where('utilisateur_id', $utilisateurAuth['id'])
            ->where('formation_id', $idFormation)
            ->first();

        if (! $inscription) {
            return response()->json(['message' => 'Inscription introuvable.'], 404);
        }

        $formation = $this->chargerFormation($idFormation);
        if (! $formation) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        $clesLecons = $this->clesLeconsFormation($formation);
        $modulesTermines = $this->filtrerProgressionSequentielle(
            $donneesValidees['completed_modules'] ?? ($inscription->completed_modules ?? []),
            $clesLecons
        );
        $lastLessonKey = $donneesValidees['last_lesson_key'] ?? $inscription->last_lesson_key;
        if ($lastLessonKey !== null && ! in_array($lastLessonKey, $clesLecons, true)) {
            $lastLessonKey = $clesLecons[0] ?? null;
        }
        $progression = $this->calculerProgressionDepuisLecons($clesLecons, $modulesTermines);

        $inscription->update([
            'progression'       => $progression,
            'completed_modules' => $modulesTermines,
            'last_lesson_key'   => $lastLessonKey,
        ]);

        $this->mongoLogger->log('course_progress_updated', [
            'user_id'           => $utilisateurAuth['id'],
            'course_id'         => $idFormation,
            'progression'       => $inscription->progression,
            'completed_modules' => $modulesTermines,
            'last_lesson_key'   => $inscription->last_lesson_key,
        ]);

        return response()->json([
            'formation_id'       => $inscription->formation_id,
            'progression'        => $inscription->progression,
            'completed_modules'  => $inscription->completed_modules ?? [],
            'last_lesson_key'    => $inscription->last_lesson_key,
        ]);
    }

    private function chargerFormation(int $idFormation): ?array
    {
        $urlCatalog = config('services.catalog.url');
        $reponseApi = Http::get("{$urlCatalog}/api/formations/{$idFormation}");

        if (! $reponseApi->ok()) {
            return null;
        }

        return $reponseApi->json();
    }

    private function clesLeconsFormation(array $formation): array
    {
        $cles = [];
        $modules = $formation['modules'] ?? [];
        foreach ($modules as $indexModule => $module) {
            $contenu = json_decode($module['contenu'] ?? '', true);
            $lecons = is_array($contenu) && isset($contenu['lessons']) && is_array($contenu['lessons'])
                ? $contenu['lessons']
                : [[]];

            foreach (array_values($lecons) as $indexLecon => $_lecon) {
                $cles[] = sprintf('%s:lesson:%d', (string) ($module['id'] ?? $module['titre'] ?? $indexModule), $indexLecon);
            }
        }

        return $cles;
    }

    private function filtrerProgressionSequentielle(array $leconsDemandees, array $clesLecons): array
    {
        $demandees = array_flip(array_map('strval', $leconsDemandees));
        $validees = [];

        foreach ($clesLecons as $cle) {
            if (! isset($demandees[$cle])) {
                break;
            }

            $validees[] = $cle;
        }

        return $validees;
    }

    private function calculerProgressionDepuisLecons(array $clesLecons, array $leconsTerminees): int
    {
        $totalLecons = count($clesLecons);

        if ($totalLecons === 0) {
            return 0;
        }

        return min(100, (int) round((count($leconsTerminees) / $totalLecons) * 100));
    }
}
