<?php

/**
 * Fichier : ModuleController.php
 * Rôle    : Gère les modules d'une formation (ajout, modification, suppression) réservés au formateur propriétaire.
 * Modifié : 2026-04-21
 */

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Module;
use App\Services\MongoActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    private const ROLE_FORMATEUR    = 'formateur';
    private const MSG_FORMATEUR_REQ = 'Seuls les formateurs peuvent gérer les modules';

    public function __construct(private MongoActivityLogger $mongoLogger)
    {
    }

    // Les méthodes suivantes sont accessibles uniquement aux formateurs propriétaires de la formation.
    public function index(Formation $formation): JsonResponse
    {
        if (! in_array($formation->statut, ['Publié', 'published'], true)) {
            return response()->json(['message' => 'Formation introuvable.'], 404);
        }

        $modules = $formation->modules()->get()->map(fn (Module $m) => $this->presenterModule($m, true));

        return response()->json($modules);
    }

    // Ajoute un nouveau module à la formation
    public function store(Request $requete, Formation $formation): JsonResponse 
    {
        // Vérification que l'utilisateur authentifié est bien le formateur propriétaire de la formation
        $utilisateurAuth = $requete->input('auth_user');

        // Vérification du rôle de l'utilisateur
        if (($utilisateurAuth['role'] ?? '') !== self::ROLE_FORMATEUR) { 
            return response()->json(['message' => self::MSG_FORMATEUR_REQ], 403);
        }

        if ($formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Cette formation ne vous appartient pas.'], 403);
        }

        // Validation des données reçues
        $donneesValidees = $requete->validate([
            'titre'   => ['required', 'string', 'max:255'], 
            'contenu' => ['required', 'string'],
            'ordre'   => ['nullable', 'integer', 'min:1'],
        ]);

        // Si aucun ordre n'est fourni, le module est placé après le dernier existant
        $ordre = $donneesValidees['ordre'] ?? ((int) $formation->modules()->max('ordre') + 1);

        // Création du module dans la base de données
        $module = Module::query()->create([
            'titre'        => $donneesValidees['titre'],
            'contenu'      => $donneesValidees['contenu'],
            'ordre'        => $ordre,
            'formation_id' => $formation->id,
        ]);

        // Log de l'activité dans MongoDB
        $this->mongoLogger->log('module_created', [
            'formation_id' => $formation->id,
            'module_id'    => $module->id,
            'created_by'   => $utilisateurAuth['id'],
        ]);

        return response()->json($this->presenterModule($module), 201);
    }

    // Met à jour un module existant
    public function update(Request $requete, Module $module): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');
        $formation       = $module->formation;

        if (($utilisateurAuth['role'] ?? '') !== self::ROLE_FORMATEUR) {
            return response()->json(['message' => self::MSG_FORMATEUR_REQ], 403);
        }

        if (! $formation || $formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Ce module ne vous appartient pas.'], 403);
        }

        $donneesValidees = $requete->validate([
            'titre'   => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'ordre'   => ['required', 'integer', 'min:1'],
        ]);

        $module->update($donneesValidees);

        $this->mongoLogger->log('module_updated', [
            'formation_id' => $formation->id,
            'module_id'    => $module->id,
            'updated_by'   => $utilisateurAuth['id'],
        ]);

        return response()->json($this->presenterModule($module));
    }

    public function destroy(Request $requete, Module $module): JsonResponse
    {
        $utilisateurAuth = $requete->input('auth_user');
        $formation       = $module->formation;

        if (($utilisateurAuth['role'] ?? '') !== self::ROLE_FORMATEUR) {
            return response()->json(['message' => self::MSG_FORMATEUR_REQ], 403);
        }

        if (! $formation || $formation->user_id !== $utilisateurAuth['id']) {
            return response()->json(['message' => 'Ce module ne vous appartient pas.'], 403);
        }

        $idModule    = $module->id;
        $idFormation = $formation->id;
        $module->delete();

        $this->mongoLogger->log('module_deleted', [
            'formation_id' => $idFormation,
            'module_id'    => $idModule,
            'deleted_by'   => $utilisateurAuth['id'],
        ]);

        return response()->json(['message' => 'Module supprimé.']);
    }

    /**
     * Formate un module en tableau simple pour les réponses JSON de l'API.
     */
    private function presenterModule(Module $module, bool $masquerReponsesCorrectes = false): array
    {
        return [
            'id'           => $module->id,
            'titre'        => $module->titre,
            'contenu'      => $masquerReponsesCorrectes ? $this->contenuApprenant($module->contenu) : $module->contenu,
            'ordre'        => $module->ordre,
            'formation_id' => $module->formation_id,
        ];
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
}
