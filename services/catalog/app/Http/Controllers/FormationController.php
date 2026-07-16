<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $niveau    = trim((string) $requete->query('level', ''));

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
            $requeteDB->whereNotIn('statut', ['Brouillon', 'Archivé']);
        }

        $inclureUserId = $utilisateurAuth && ($utilisateurAuth['role'] ?? '') === 'formateur';

        $formations = $requeteDB->orderByDesc('date')->get()
            ->map(fn (Formation $f) => $this->presenterFormation($f, $inclureUserId));

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
            ->map(fn (Formation $f) => $this->presenterFormation($f, true));

        return response()->json($formations);
    }

    public function show(Formation $formation): JsonResponse
    {
        $formation->increment('vues');
        $formation->refresh();
        $formation->load(['modules' => fn ($q) => $q->orderBy('ordre')]);

        $this->mongoLogger->log('course_viewed', ['course_id' => $formation->id]);

        return response()->json([
            ...$this->presenterFormation($formation, false),
            'modules' => $formation->modules->map(fn ($m) => [
                'id'      => $m->id,
                'titre'   => $m->titre,
                'contenu' => $m->contenu,
                'ordre'   => $m->ordre,
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

        $formation = Formation::query()->create([
            'titre'            => $donneesValidees['titre'],
            'description'      => $donneesValidees['description'],
            'category'         => $donneesValidees['category'],
            'date'             => $donneesValidees['date'],
            'statut'           => $donneesValidees['statut'] ?? 'Brouillon',
            'duration'         => $donneesValidees['duration'],
            'level'            => $donneesValidees['level'],
            'image_url'        => $donneesValidees['image_url'] ?? null,
            'vues'             => 0,
            'user_id'          => $utilisateurAuth['id'],
            'formateur_nom'    => $utilisateurAuth['nom'],
            'apprenants_count' => 0,
        ]);

        $this->mongoLogger->log('course_created', [
            'course_id'  => $formation->id,
            'created_by' => $utilisateurAuth['id'],
        ]);

        $this->remplacerModules($formation, $donneesValidees['modules']);

        return response()->json($this->presenterFormation($formation, true), 201);
    }

    public function update(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent modifier une formation.'], 403);
        }

        if ($formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate($this->reglesFormation(false));

        $formation->update([
            'titre'       => $donneesValidees['titre'],
            'description' => $donneesValidees['description'],
            'category'    => $donneesValidees['category'],
            'date'        => $donneesValidees['date'],
            'statut'      => $donneesValidees['statut'] ?? $formation->statut,
            'duration'    => $donneesValidees['duration'] ?? $formation->duration,
            'level'       => $donneesValidees['level'] ?? $formation->level,
            'image_url'   => $donneesValidees['image_url'] ?? $formation->image_url,
        ]);

        $this->mongoLogger->log('course_update', [
            'course_id'  => $formation->id,
            'updated_by' => $utilisateurAuth['id'],
        ]);

        if (\array_key_exists('modules', $donneesValidees)) {
            $this->remplacerModules($formation, $donneesValidees['modules']);
        }

        return response()->json($this->presenterFormation($formation, true));
    }

    public function destroy(Request $requete, Formation $formation): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');

        if (($utilisateurAuth['role'] ?? '') !== 'formateur') {
            return response()->json(['message' => 'Seuls les formateurs peuvent supprimer une formation.'], 403);
        }

        if ($formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        $idFormation = $formation->id;
        $formation->delete();

        $this->mongoLogger->log('course_deleted', [
            'course_id'  => $idFormation,
            'deleted_by' => $utilisateurAuth['id'],
        ]);

        return response()->json(['message' => 'Formation supprimée avec succès.']);
    }

    private function reglesFormation(bool $creation): array
    {
        $requis = $creation ? 'required' : 'nullable';

        return [
            'titre'             => ['required', 'string', 'max:255'],
            'description'       => ['required', 'string'],
            'category'          => ['required', 'string', 'max:100'],
            'date'              => ['required', 'date'],
            'statut'            => ['nullable', 'string', 'max:60'],
            'duration'          => [$requis, 'integer', 'min:1'],
            'level'             => [$requis, 'in:beginner,intermediaire,advanced'],
            'image_url'         => ['nullable', 'string', 'max:2048'],
            'modules'           => [$creation ? 'required' : 'nullable', 'array', 'min:1'],
            'modules.*.titre'   => ['required_with:modules', 'string', 'max:255'],
            'modules.*.contenu' => ['required_with:modules', 'string'],
        ];
    }

    private function presenterFormation(Formation $formation, bool $inclureUserId): array
    {
        $donnees = [
            'id'          => $formation->id,
            'titre'       => $formation->titre,
            'description' => $formation->description,
            'category'    => $formation->category,
            'date'        => optional($formation->date)->format('Y-m-d'),
            'statut'      => $formation->statut,
            'duration'    => $formation->duration,
            'level'       => $formation->level,
            'image_url'   => $formation->image_url,
            'vues'        => $formation->vues,
            'apprenants'  => $formation->apprenants_count ?? 0,
            'formateur'   => $formation->formateur_nom,
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
                'titre'        => $module['titre'],
                'contenu'      => $module['contenu'],
                'ordre'        => $index + 1,
                'formation_id' => $formation->id,
            ]);
        }
    }
}
