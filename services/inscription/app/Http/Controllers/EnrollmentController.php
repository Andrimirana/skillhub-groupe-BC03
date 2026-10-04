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

        $inscription = Enrollment::query()->firstOrCreate([
            'utilisateur_id' => $utilisateurAuth['id'],
            'formation_id'   => $idFormation,
        ], [
            'utilisateur_nom'  => $utilisateurAuth['nom'] ?? null,
            'progression'      => 0,
            'completed_modules'=> [],
            'last_lesson_key'  => null,
            'date_inscription' => now(),
        ]);

        if ($inscription->wasRecentlyCreated) {
            $this->synchroniserApprenants($idFormation);
        }


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

        $this->synchroniserApprenants($idFormation);

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
                'avis_note'        => $inscription->avis_note,
                'avis_commentaire' => $inscription->avis_commentaire,
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
            'progression'          => ['nullable', 'integer', 'min:0', 'max:100'],
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

        $modulesTermines = array_values(array_unique(
            $donneesValidees['completed_modules'] ?? ($inscription->completed_modules ?? [])
        ));

        $inscription->update([
            'progression'       => $donneesValidees['progression'] ?? $inscription->progression,
            'completed_modules' => $modulesTermines,
            'last_lesson_key'   => $donneesValidees['last_lesson_key'] ?? $inscription->last_lesson_key,
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
    // Enregistre ou modifie l'avis d'un apprenant inscrit à la formation.
    public function donnerAvis(Request $requete, int $idFormation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'apprenant') {
            return response()->json(['message' => 'Seuls les apprenants peuvent laisser un avis.'], 403);
        }

        $donneesValidees = $requete->validate([
            'note'        => ['required', 'integer', 'min:1', 'max:5'],
            'commentaire' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $inscription = Enrollment::query()
            ->where('utilisateur_id', $utilisateurAuth['id'])
            ->where('formation_id', $idFormation)
            ->first();

        if (! $inscription) {
            return response()->json(['message' => 'Vous devez suivre cette formation pour laisser un avis.'], 404);
        }

        $inscription->update([
            'utilisateur_nom'  => $utilisateurAuth['nom'] ?? $inscription->utilisateur_nom,
            'avis_note'        => $donneesValidees['note'],
            'avis_commentaire' => trim($donneesValidees['commentaire']),
            'avis_date'        => now(),
        ]);

        $this->mongoLogger->log('course_review', [
            'user_id'   => $utilisateurAuth['id'],
            'course_id' => $idFormation,
            'note'      => $donneesValidees['note'],
        ]);

        return response()->json($this->presenterAvis($inscription));
    }

    // Derniers avis laissés sur toutes les formations (page d'accueil).
    public function avisRecents(Request $requete): JsonResponse
    {
        $limite = min(max((int) $requete->query('limit', 8), 1), 20);

        $avis = Enrollment::query()
            ->whereNotNull('avis_note')
            ->orderByDesc('avis_date')
            ->limit($limite)
            ->get()
            ->map(fn (Enrollment $inscription) => $this->presenterAvis($inscription));

        return response()->json($avis->values());
    }

    // Avis d'une formation avec la note moyenne.
    public function avisFormation(int $idFormation): JsonResponse
    {
        $avis = Enrollment::query()
            ->where('formation_id', $idFormation)
            ->whereNotNull('avis_note')
            ->orderByDesc('avis_date')
            ->get();

        return response()->json([
            'moyenne' => $avis->isEmpty() ? null : round($avis->avg('avis_note'), 1),
            'total'   => $avis->count(),
            'avis'    => $avis->map(fn (Enrollment $inscription) => $this->presenterAvis($inscription))->values(),
        ]);
    }

    // Statistiques des formations d'un formateur : inscrits, progression moyenne et dernières inscriptions.
    public function statistiquesFormateur(Request $requete): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent consulter ces statistiques.'], 403);
        }

        $ids = collect(explode(',', (string) $requete->query('ids', '')))
            ->map(fn ($id) => (int) trim($id))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->take(200)
            ->values();

        if ($ids->isEmpty()) {
            return response()->json(['formations' => [], 'inscriptions_recentes' => []]);
        }

        $inscriptions = Enrollment::query()->whereIn('formation_id', $ids)->get();

        $formations = $ids->map(function (int $id) use ($inscriptions): array {
            $liste = $inscriptions->where('formation_id', $id);

            return [
                'formation_id'        => $id,
                'inscrits'            => $liste->count(),
                'progression_moyenne' => $liste->isEmpty() ? 0 : (int) round($liste->avg('progression')),
                'termines'            => $liste->where('progression', '>=', 100)->count(),
                'note_moyenne'        => $liste->whereNotNull('avis_note')->isEmpty()
                    ? null
                    : round($liste->whereNotNull('avis_note')->avg('avis_note'), 1),
            ];
        });

        $recentes = $inscriptions
            ->sortByDesc('date_inscription')
            ->take(6)
            ->map(fn (Enrollment $inscription): array => [
                'formation_id'     => $inscription->formation_id,
                'nom'              => $inscription->utilisateur_nom ?: 'Apprenant SkillHub',
                'progression'      => $inscription->progression,
                'date_inscription' => optional($inscription->date_inscription)->toIso8601String(),
            ])
            ->values();

        return response()->json([
            'formations'            => $formations->values(),
            'inscriptions_recentes' => $recentes,
        ]);
    }

    private function presenterAvis(Enrollment $inscription): array
    {
        return [
            'formation_id' => $inscription->formation_id,
            'nom'          => $inscription->utilisateur_nom ?: 'Apprenant SkillHub',
            'note'         => $inscription->avis_note,
            'commentaire'  => $inscription->avis_commentaire,
            'date'         => optional($inscription->avis_date)->toIso8601String(),
            'progression'  => $inscription->progression,
        ];
    }

    // Envoie au service Catalog le nombre réel d'apprenants inscrits à la formation.
    private function synchroniserApprenants(int $idFormation): void
    {
        $total = Enrollment::query()->where('formation_id', $idFormation)->count();

        try {
            Http::withHeaders(['X-Service-Key' => (string) config('services.internal.key')])
                ->timeout(3)
                ->put(config('services.catalog.url') . "/api/internal/formations/{$idFormation}/apprenants", [
                    'apprenants' => $total,
                ]);
        } catch (\Throwable $e) {
            error_log('[synchroniserApprenants] ' . $e->getMessage());
        }
    }
}
