<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FormationController extends Controller
{
    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    public function index(Request $requete): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');
        $requeteDB = Formation::query()->with('modules');

        $recherche = trim((string) $requete->query('recherche', $requete->query('search', '')));
        $categorie = trim((string) $requete->query('category', ''));
        $niveau = trim((string) $requete->query('level', ''));

        if ($recherche !== '') {
            $requeteDB->where(function ($q) use ($recherche): void {
                $q->where('titre', 'like', "%{$recherche}%")
                    ->orWhere('description', 'like', "%{$recherche}%");
            });
        }

        if ($categorie !== '') {
            $requeteDB->where('category', $categorie);
        }

        if ($niveau !== '') {
            $requeteDB->where('level', $niveau);
        }

        if ($utilisateurAuth && ($utilisateurAuth['role'] ?? '') === 'formateur') {
            $requeteDB->where('user_id', $utilisateurAuth['id']);
        } else {
            $requeteDB->whereIn('statut', $this->statutsPublies());
        }

        $inclureUserId = $utilisateurAuth && ($utilisateurAuth['role'] ?? '') === 'formateur';
        $formations = $requeteDB->orderByDesc('date')->get()
            ->map(fn (Formation $formation) => $this->presenterFormation($formation, $inclureUserId));

        return response()->json($formations);
    }

    public function myFormations(Request $requete): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent accéder à leurs formations.'], 403);
        }

        $formations = Formation::query()
            ->where('user_id', $utilisateurAuth['id'])
            ->with('modules')
            ->orderByDesc('date')
            ->get()
            ->map(fn (Formation $formation) => $this->presenterFormation($formation, true));

        return response()->json($formations);
    }

    public function show(Formation $formation): JsonResponse
    {
        if (! in_array($formation->statut, $this->statutsPublies(), true)) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        $formation->increment('vues');
        $formation->refresh();
        $formation->load(['modules' => fn ($q) => $q->orderBy('ordre')]);

        $this->mongoLogger->log('course_viewed', ['course_id' => $formation->id]);

        return response()->json([
            ...$this->presenterFormation($formation, false),
            'modules' => $formation->modules->map(fn (Module $module) => [
                'id' => $module->id,
                'titre' => $module->titre,
                'contenu' => $this->contenuApprenant($module->contenu),
                'ordre' => $module->ordre,
            ])->values(),
        ]);
    }

    public function store(Request $requete): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent créer une formation.'], 403);
        }

        $donneesValidees = $requete->validate($this->reglesFormation(true));

        $formation = DB::transaction(function () use ($donneesValidees, $utilisateurAuth): Formation {
            $formation = Formation::query()->create([
                'titre' => $donneesValidees['titre'],
                'description' => $donneesValidees['description'],
                'category' => $donneesValidees['category'],
                'date' => $donneesValidees['date'],
                'statut' => $donneesValidees['statut'] ?? 'Brouillon',
                'duration' => $donneesValidees['duration'],
                'level' => $donneesValidees['level'],
                'image_url' => $donneesValidees['image_url'] ?? null,
                'vues' => 0,
                'user_id' => $utilisateurAuth['id'],
                'formateur_nom' => $utilisateurAuth['nom'],
                'apprenants_count' => 0,
            ]);

            $this->remplacerModules($formation, $donneesValidees['modules']);

            return $formation->fresh();
        });

        $this->mongoLogger->log('course_created', [
            'course_id' => $formation->id,
            'created_by' => $utilisateurAuth['id'],
        ]);

        return response()->json($this->presenterFormation($formation, true), 201);
    }

    public function update(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent modifier une formation.'], 403);
        }

        if ((int) $formation->user_id !== (int) $utilisateurAuth['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate($this->reglesFormation(false));
        $anciennesValeurs = $this->snapshotFormation($formation);

        DB::transaction(function () use ($donneesValidees, $formation): void {
            $formation->update([
                'titre' => $donneesValidees['titre'],
                'description' => $donneesValidees['description'],
                'category' => $donneesValidees['category'],
                'date' => $donneesValidees['date'],
                'statut' => $donneesValidees['statut'] ?? $formation->statut,
                'duration' => $donneesValidees['duration'] ?? $formation->duration,
                'level' => $donneesValidees['level'] ?? $formation->level,
                'image_url' => $donneesValidees['image_url'] ?? $formation->image_url,
            ]);

            if (array_key_exists('modules', $donneesValidees)) {
                $this->remplacerModules($formation, $donneesValidees['modules']);
            }
        });

        $formation->refresh();

        $this->mongoLogger->log('course_update', [
            'course_id' => $formation->id,
            'updated_by' => $utilisateurAuth['id'],
            'old_values' => $anciennesValeurs,
            'new_values' => $this->snapshotFormation($formation),
        ]);

        return response()->json($this->presenterFormation($formation, true));
    }

    public function destroy(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent supprimer une formation.'], 403);
        }

        if ((int) $formation->user_id !== (int) $utilisateurAuth['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $idFormation = $formation->id;
        $formation->delete();

        $this->mongoLogger->log('course_deleted', [
            'course_id' => $idFormation,
            'deleted_by' => $utilisateurAuth['id'],
        ]);

        return response()->json(['message' => 'Formation supprimée avec succès.']);
    }

    private function reglesFormation(bool $creation): array
    {
        $requis = $creation ? 'required' : 'nullable';

        return [
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'date' => ['required', 'date'],
            'statut' => ['nullable', 'string', Rule::in($this->statutsAutorises())],
            'duration' => [$requis, 'integer', 'min:1'],
            'level' => [$requis, Rule::in(['beginner', 'intermediaire', 'intermediate', 'advanced'])],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'modules' => [$creation ? 'required' : 'nullable', 'array', 'min:2'],
            'modules.*.titre' => ['required_with:modules', 'string', 'max:255'],
            'modules.*.contenu' => ['required_with:modules', 'string'],
        ];
    }

    private function snapshotFormation(Formation $formation): array
    {
        $formation->loadMissing(['modules' => fn ($q) => $q->orderBy('ordre')]);

        return [
            'titre' => $formation->titre,
            'description' => $formation->description,
            'category' => $formation->category,
            'date' => optional($formation->date)->format('Y-m-d'),
            'statut' => $formation->statut,
            'duration' => $formation->duration,
            'level' => $formation->level,
            'image_url' => $formation->image_url,
            'modules' => $formation->modules->map(fn (Module $module) => [
                'id' => $module->id,
                'titre' => $module->titre,
                'contenu' => $module->contenu,
                'ordre' => $module->ordre,
            ])->values()->all(),
        ];
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
            'duration' => $formation->duration,
            'level' => $formation->level,
            'image_url' => $formation->image_url,
            'vues' => $formation->vues,
            'apprenants' => $formation->apprenants_count ?? 0,
            'formateur' => $formation->formateur_nom,
        ];

        if ($inclureUserId) {
            $donnees['user_id'] = $formation->user_id;
        }

        return $donnees;
    }

    private function remplacerModules(Formation $formation, array $modules): void
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

    private function contenuApprenant(?string $contenu): string
    {
        $donnees = json_decode((string) $contenu, true);
        if (! is_array($donnees)) {
            return (string) $contenu;
        }

        return json_encode($this->retirerReponsesCorrectes($donnees), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function retirerReponsesCorrectes(array $donnees): array
    {
        foreach ($donnees as $cle => $valeur) {
            if (in_array($cle, ['correcte', 'is_correct', 'correct_answer', 'answer_key'], true)) {
                unset($donnees[$cle]);
                continue;
            }

            if (is_array($valeur)) {
                $donnees[$cle] = $this->retirerReponsesCorrectes($valeur);
            }
        }

        return $donnees;
    }

    private function statutsPublies(): array
    {
        return ['Publié', 'published'];
    }

    private function statutsAutorises(): array
    {
        return ['Brouillon', 'Publié', 'Archivé', 'draft', 'published', 'archived'];
    }
}
