<?php

/**
 * Fichier : AuthController.php
 * Rôle    : Gère l'inscription, la connexion, la déconnexion et la validation des jetons JWT.
 * Modifié : 2026-04-21
 */

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ServiceJwt;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Throwable;

class AuthController extends Controller
{
    public function __construct(private ServiceJwt $serviceJwt)
    {
    }

    public function inscription(Request $requete): JsonResponse
    {
        $donneesValidees = $requete->validate([
            'nom'          => ['required', 'string', 'max:255'],
            'email'        => ['required', 'email', 'max:255', 'unique:users,email'],
            'mot_de_passe' => ['required', 'string', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/'],
            'role'         => ['required', 'in:formateur,apprenant'],
        ]);

        $utilisateur = User::query()->create([
            'name'     => $donneesValidees['nom'],
            'email'    => $donneesValidees['email'],
            // Le mot de passe est haché avec bcrypt (sécurité renforcée)
            'password' => Hash::make($donneesValidees['mot_de_passe']),
            'role'     => $donneesValidees['role'],
        ]);

        $expiration = CarbonImmutable::now()->addHours(8)->timestamp;

        $jeton = $this->serviceJwt->generer([
            'sub'   => $utilisateur->id,
            'email' => $utilisateur->email,
            'role'  => $utilisateur->role,
            'iat'   => CarbonImmutable::now()->timestamp,
            'exp'   => $expiration,
        ]);

        return response()->json($this->construireReponseJwt($utilisateur, $jeton, $expiration), 201);
    }

    public function connexion(Request $requete): JsonResponse
    {
        $donneesValidees = $requete->validate([
            'email'        => ['required', 'email'],
            'mot_de_passe' => ['required', 'string'],
        ]);

        $utilisateur = User::query()->where('email', $donneesValidees['email'])->first();

        // Vérification timing-safe avec Hash::check() (protection contre timing attacks)
        if (! $utilisateur || ! Hash::check($donneesValidees['mot_de_passe'], $utilisateur->password)) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        $expiration = CarbonImmutable::now()->addHours(8)->timestamp;

        $jeton = $this->serviceJwt->generer([
            'sub'   => $utilisateur->id,
            'email' => $utilisateur->email,
            'role'  => $utilisateur->role,
            'iat'   => CarbonImmutable::now()->timestamp,
            'exp'   => $expiration,
        ]);

        return response()->json($this->construireReponseJwt($utilisateur, $jeton, $expiration));
    }

    public function profil(Request $requete): JsonResponse
    {
        return response()->json($this->presenterUtilisateur($requete->user()));
    }

    public function deconnexion(Request $requete): JsonResponse
    {
        $jeton = $requete->bearerToken();

        if ($jeton) {
            try {
                $donneesJwt       = $this->serviceJwt->decoder($jeton);
                $expiration        = (int) ($donneesJwt['exp'] ?? CarbonImmutable::now()->addHours(8)->timestamp);
                $secondesRestantes = max(1, $expiration - CarbonImmutable::now()->timestamp);

                // Le jeton est mis en blacklist dans le cache jusqu'à son expiration naturelle
                Cache::put($this->cleBlacklist($jeton), true, now()->addSeconds($secondesRestantes));
            } catch (Throwable $e) {
                error_log('[Auth] Erreur blacklist jeton : ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Déconnexion effectuée.']);
    }

    public function modifierMotDePasse(Request $requete): JsonResponse
    {
        $utilisateur = $requete->user();

        $donneesValidees = $requete->validate([
            'ancien_mot_de_passe'  => ['required', 'string'],
            'nouveau_mot_de_passe' => ['required', 'string', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/', 'different:ancien_mot_de_passe'],
        ]);

        // Vérification timing-safe de l'ancien mot de passe
        if (! Hash::check($donneesValidees['ancien_mot_de_passe'], $utilisateur->password)) {
            return response()->json(['message' => "L'ancien mot de passe est incorrect."], 403);
        }

        $utilisateur->password = Hash::make($donneesValidees['nouveau_mot_de_passe']);
        $utilisateur->save();

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    public function validateToken(Request $requete): JsonResponse
    {
        $jeton = $requete->bearerToken();

        if (! $jeton) {
            return response()->json(['valid' => false, 'message' => 'Jeton manquant.'], 401);
        }

        if (Cache::has($this->cleBlacklist($jeton))) {
            return response()->json(['valid' => false, 'message' => 'Jeton blacklisté.'], 401);
        }

        try {
            $donneesJwt    = $this->serviceJwt->decoder($jeton);
            $idUtilisateur = (int) ($donneesJwt['sub'] ?? 0);
            $utilisateur   = User::query()->find($idUtilisateur);

            if (! $utilisateur) {
                return response()->json(['valid' => false, 'message' => 'Utilisateur introuvable.'], 401);
            }

            return response()->json(['valid' => true, 'user' => $this->presenterUtilisateur($utilisateur)]);
        } catch (Throwable) {
            return response()->json(['valid' => false, 'message' => 'Jeton invalide ou expiré.'], 401);
        }
    }

    private function presenterUtilisateur(User $utilisateur): array
    {
        return [
            'id'    => $utilisateur->id,
            'nom'   => $utilisateur->name,
            'email' => $utilisateur->email,
            'role'  => $utilisateur->role,
        ];
    }

    private function construireReponseJwt(User $utilisateur, string $jeton, int $expiration): array
    {
        return [
            'token'       => $jeton,
            'token_type'  => 'Bearer',
            'expires_at'  => $expiration,
            'utilisateur' => $this->presenterUtilisateur($utilisateur),
        ];
    }

    private function cleBlacklist(string $jeton): string
    {
        return 'jwt_blacklist:' . hash('sha256', $jeton);
    }
}
