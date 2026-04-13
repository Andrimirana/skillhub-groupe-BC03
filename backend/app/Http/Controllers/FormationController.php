<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Models\User;
use App\Services\MongoActivityLogger;
use App\Services\ServiceJwt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class FormationController extends Controller
{
    public function __construct(
        private MongoActivityLogger $mongoLogger,
        private ServiceJwt $serviceJwt,
    )
    {
    }

    public function myFormations(Request $requete): JsonResponse
    {
        $utilisateur = $this->resolveUtilisateur($requete);

        if ($utilisateur->role !== 'formateur') {
            return response()->json([
                'message' => 'Seuls les formateurs peuvent accéder à leurs formations',
            ], 403);
        }

        $formations = Formation::query()
            ->withCount('inscriptions')
            ->where('user_id', $utilisateur->id)
            ->orderByDesc('date')
            ->get()
            ->map(fn (Formation $formation) => $this->presenterFormation($formation, true));

        return response()->json($formations);
    }

    private function resolveUtilisateur(Request $requete): ?User
    {
        $utilisateur = $requete->user();

        if ($utilisateur) {
            return $utilisateur;
        }

        $jeton = $requete->bearerToken();

        if (! $jeton) {
            return null;
        }

        try {
            $payload = $this->serviceJwt->decoder($jeton);
            $idUtilisateur = (int) ($payload['sub'] ?? 0);

            if ($idUtilisateur <= 0) {
                return null;
            }

            return User::query()->find($idUtilisateur);
        } catch (Throwable) {
            return null;
        }
    }

    public function index(Request $requete): JsonResponse
    {
        $utilisateur = $requete->user();

        $requeteFormations = Formation::query()
            ->withCount('inscriptions')
            ->with('formateur:id,name')
            ->orderByDesc('date');

        $recherche = trim((string) $requete->query('recherche', $requete->query('search', '')));
        $categorie = trim((string) $requete->query('category', ''));
        $niveau = trim((string) $requete->query('level', ''));

        if ($recherche !== '') {
            $requeteFormations->where(function ($query) use ($recherche): void {
                $query->where('titre', 'like', "%{$recherche}%")
                    ->orWhere('description', 'like', "%{$recherche}%");
            });
        }

        if ($categorie !== '') {
            $requeteFormations->where('category', $categorie);
        }

        if ($niveau !== '') {
            $requeteFormations->where('level', $niveau);
        }

        if ($utilisateur?->role === 'formateur') {
            $requeteFormations->where('user_id', $utilisateur->id);
        }

        $inclureUserId = $utilisateur?->role === 'formateur';

        $formations = $requeteFormations->get()
            ->map(fn (Formation $formation) => $this->presenterFormation($formation, $inclureUserId));

        return response()->json($formations);
    }

    public function show(Formation $formation): JsonResponse
    {
        $formation->increment('vues');
        $formation->refresh();
        $formation->loadCount('inscriptions');
        $formation->load(['modules' => fn ($query) => $query->orderBy('ordre'), 'formateur:id,name']);

        $this->mongoLogger->log('course_viewed', [
            'course_id' => $formation->id,
        ]);

        return response()->json([
            ...$this->presenterFormation($formation, false),
            'modules' => $formation->modules->map(fn ($module) => [
                'id' => $module->id,
                'titre' => $module->titre,
                'contenu' => $module->contenu,
                'ordre' => $module->ordre,
            ])->values(),
        ]);
    }

    public function store(Request $requete): JsonResponse
    {
        $utilisateur = $requete->user();

        if ($utilisateur->role !== 'formateur') {
            return response()->json([
                'message' => 'Seuls les formateurs peuvent créer une formation.',
            ], 403);
        }

        $donneesValidees = $requete->validate([
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'date' => ['required', 'date'],
            'statut' => ['nullable', 'string', 'max:60'],
            'price' => ['required', 'numeric', 'min:0'],
            'duration' => ['required', 'integer', 'min:1'],
            'level' => ['required', 'in:beginner,intermediaire,advanced'],
            'modules' => ['nullable', 'array', 'min:3'],
            'modules.*.titre' => ['required_with:modules', 'string', 'max:255'],
            'modules.*.contenu' => ['required_with:modules', 'string'],
        ]);

        $formation = Formation::query()->create([
            'titre' => $donneesValidees['titre'],
            'description' => $donneesValidees['description'],
            'category' => $donneesValidees['category'],
            'date' => $donneesValidees['date'],
            'statut' => $donneesValidees['statut'] ?? 'À venir',
            'price' => $donneesValidees['price'],
            'duration' => $donneesValidees['duration'],
            'level' => $donneesValidees['level'],
            'vues' => 0,
            'user_id' => $utilisateur->id,
        ]);

        $this->mongoLogger->log('course_created', [
            'course_id' => $formation->id,
            'created_by' => $utilisateur->id,
        ]);

        $this->remplacerModulesFormation($formation, $donneesValidees['modules'] ?? $this->modulesParDefaut());

        $formation->loadCount('inscriptions');

        return response()->json([
            ...$this->presenterFormation($formation, true),
        ], 201);
    }

    public function update(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateur = $requete->user();

        if ($utilisateur->role !== 'formateur') {
            return response()->json([
                'message' => 'Seuls les formateurs peuvent modifier une formation.',
            ], 403);
        }

        if ($formation->user_id !== $utilisateur->id) {
            return response()->json([
                'message' => 'Cette formation ne vous appartient pas.',
            ], 403);
        }

        $donneesValidees = $requete->validate([
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'date' => ['required', 'date'],
            'statut' => ['nullable', 'string', 'max:60'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'level' => ['nullable', 'in:beginner,intermediaire,advanced'],
            'modules' => ['nullable', 'array', 'min:3'],
            'modules.*.titre' => ['required_with:modules', 'string', 'max:255'],
            'modules.*.contenu' => ['required_with:modules', 'string'],
        ]);

        $anciennesValeurs = [
            'titre' => $formation->titre,
            'description' => $formation->description,
            'category' => $formation->category,
            'date' => optional($formation->date)->format('Y-m-d'),
            'statut' => $formation->statut,
            'price' => (float) $formation->price,
            'duration' => $formation->duration,
            'level' => $formation->level,
        ];

        $formation->update([
            'titre' => $donneesValidees['titre'],
            'description' => $donneesValidees['description'],
            'category' => $donneesValidees['category'],
            'date' => $donneesValidees['date'],
            'statut' => $donneesValidees['statut'] ?? $formation->statut,
            'price' => $donneesValidees['price'] ?? $formation->price,
            'duration' => $donneesValidees['duration'] ?? $formation->duration,
            'level' => $donneesValidees['level'] ?? $formation->level,
        ]);

        $this->mongoLogger->log('course_update', [
            'course_id' => $formation->id,
            'updated_by' => $utilisateur->id,
            'old_values' => $anciennesValeurs,
            'new_values' => [
                'titre' => $formation->titre,
                'description' => $formation->description,
                'category' => $formation->category,
                'date' => optional($formation->date)->format('Y-m-d'),
                'statut' => $formation->statut,
                'price' => (float) $formation->price,
                'duration' => $formation->duration,
                'level' => $formation->level,
            ],
        ]);

        if (array_key_exists('modules', $donneesValidees)) {
            $this->remplacerModulesFormation($formation, $donneesValidees['modules']);
        } elseif ($formation->modules()->count() < 3) {
            $this->remplacerModulesFormation($formation, $this->modulesParDefaut());
        }

        $formation->loadCount('inscriptions');

        return response()->json([
            ...$this->presenterFormation($formation, true),
        ]);
    }

    public function destroy(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateur = $requete->user();

        if ($utilisateur->role !== 'formateur') {
            return response()->json([
                'message' => 'Seuls les formateurs peuvent supprimer une formation.',
            ], 403);
        }

        if ($formation->user_id !== $utilisateur->id) {
            return response()->json([
                'message' => 'Cette formation ne vous appartient pas.',
            ], 403);
        }

        $formationId = $formation->id;
        $formation->delete();

        $this->mongoLogger->log('course_deleted', [
            'course_id' => $formationId,
            'deleted_by' => $utilisateur->id,
        ]);

        return response()->json([
            'message' => 'Formation supprimée avec succès.',
        ]);
    }

    private function presenterFormation(Formation $formation, bool $inclureUserId): array
    {
        $donnees = [
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
            'apprenants' => $formation->inscriptions_count ?? $formation->inscriptions()->count(),
            'formateur' => $formation->formateur?->name,
        ];

        if ($inclureUserId) {
            $donnees['user_id'] = $formation->user_id;
        }

        return $donnees;
    }

    private function remplacerModulesFormation(Formation $formation, array $modules): void
    {
        $formation->modules()->delete();

        foreach (array_values($modules) as $index => $module) {
            Module::query()->create([
                'titre' => $module['titre'],
                'contenu' => $module['contenu'],
                'ordre' => $index + 1,
                'formation_id' => $formation->id,
            ]);
        }
    }

    private function modulesParDefaut(): array
    {
        return [
            ['titre' => 'Introduction', 'contenu' => 'Présentation générale de la formation.'],
            ['titre' => 'Concepts fondamentaux', 'contenu' => 'Notions essentielles à maîtriser.'],
            ['titre' => 'Projet pratique', 'contenu' => 'Application concrète des acquis.'],
        ];
    }
}
