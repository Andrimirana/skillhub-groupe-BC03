<?php

namespace App\Http\Controllers\Examples;

use App\Traits\MongoActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Exemples d'utilisation du MongoActivityLogger
 * 
 * Ce contrôleur démontre comment utiliser le trait MongoActivityLogger
 * pour enregistrer les activités utilisateur dans MongoDB
 * 
 * Note: Ceci est un fichier d'exemple. À intégrer dans vos vrais contrôleurs.
 */
class ActivityExampleController extends Controller
{
    use MongoActivityLogger;

    /**
     * Exemple: Enregistrer une connexion
     */
    public function loginExample()
    {
        // ... logique de connexion ...
        
        // Enregistrer le login
        self::logLogin();
        
        return response()->json(['message' => 'Login enregistré']);
    }

    /**
     * Exemple: Enregistrer la consultation d'une formation
     */
    public function viewFormationExample($formationId)
    {
        // Récupérer la formation
        $formation = \App\Models\Formation::findOrFail($formationId);
        
        // Enregistrer la consultation
        self::logFormationView($formation->id, $formation->title);
        
        return response()->json($formation);
    }

    /**
     * Exemple: Enregistrer la complétion d'un module
     */
    public function completeModuleExample($formationId, $moduleId)
    {
        // Récupérer le module
        $module = \App\Models\Module::findOrFail($moduleId);
        
        // Enregistrer la complétion avec score
        self::logModuleComplete(
            $formationId, 
            $module->id, 
            $module->title, 
            95.5  // Score optionnel
        );
        
        return response()->json(['message' => 'Module complété']);
    }

    /**
     * Exemple: Enregistrer un téléchargement de ressource
     */
    public function downloadResourceExample($resourceId)
    {
        // Récupérer la ressource
        $resource = \App\Models\Resource::findOrFail($resourceId);
        
        // Enregistrer le téléchargement
        self::logResourceDownload(
            'resource',
            $resource->id,
            $resource->title
        );
        
        // Retourner le fichier
        return response()->download($resource->file_path, $resource->filename);
    }

    /**
     * Exemple: Enregistrer une note/évaluation
     */
    public function submitRatingExample($formationId, Request $request)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'comment' => 'nullable|string|max:500',
        ]);

        // Récupérer la formation
        $formation = \App\Models\Formation::findOrFail($formationId);
        
        // Enregistrer l'évaluation
        self::logRatingSubmitted(
            $formation->id,
            $formation->title,
            $validated['rating'],
            $validated['comment'] ?? null
        );

        // Sauvegarder l'évaluation en base de données
        $rating = $formation->ratings()->create([
            'user_id' => auth()->id(),
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json($rating);
    }

    /**
     * Exemple: Enregistrer la génération d'un certificat
     */
    public function generateCertificateExample($formationId)
    {
        // Récupérer la formation
        $formation = \App\Models\Formation::findOrFail($formationId);
        
        // Vérifier que l'utilisateur a complété la formation
        $userProgress = auth()->user()->progressInFormation($formationId);
        
        if ($userProgress->progress_percentage != 100) {
            return response()->json(
                ['error' => 'Formation non complétée'],
                422
            );
        }

        // Générer le certificat
        $certificateNumber = 'CERT-' . date('Y') . '-' . auth()->id() . '-' . uniqid();
        
        // Enregistrer la génération du certificat
        self::logCertificateGenerated(
            $formation->id,
            $formation->title,
            $certificateNumber
        );

        // Sauvegarder le certificat
        $certificate = auth()->user()->certificates()->create([
            'formation_id' => $formation->id,
            'certificate_number' => $certificateNumber,
            'generated_at' => now(),
        ]);

        return response()->json($certificate);
    }

    /**
     * Exemple: Enregistrement personnalisé d'une activité
     */
    public function customActivityExample(Request $request)
    {
        // Enregistrer une activité personnalisée
        self::logActivity('custom_action', [
            'resourceType' => $request->input('resource_type'),
            'resourceId' => $request->input('resource_id'),
            'resourceTitle' => $request->input('resource_title'),
            'metadata' => $request->input('metadata', []),
        ]);

        return response()->json(['message' => 'Activité enregistrée']);
    }

    /**
     * Exemple: Déconnexion avec logging
     */
    public function logoutExample()
    {
        // Enregistrer la déconnexion
        self::logLogout();
        
        // ... logique de déconnexion ...
        
        return response()->json(['message' => 'Déconnecté']);
    }
}
