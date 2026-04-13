<?php

/*
| Projet: SkillHub
| Rôle du fichier: Controller API pour authentification
| Dernière modification: 2026-03-06
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
        // Validation stricte pour éviter les comptes incomplets ou faibles
        $donneesValidees = $requete->validate([
            'nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'mot_de_passe' => ['required', 'string', 'min:8', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/'],
            'role' => ['required', 'in:formateur,apprenant'],
        ]);

        $utilisateur = User::query()->create([
            'name' => $donneesValidees['nom'],
            'email' => $donneesValidees['email'],
            'password' => Hash::make($donneesValidees['mot_de_passe']),
            'role' => $donneesValidees['role'],
        ]);

        $expiration = CarbonImmutable::now()->addHours(8)->timestamp;

        $jeton = $this->serviceJwt->generer([
            'sub' => $utilisateur->id,
            'email' => $utilisateur->email,
            'role' => $utilisateur->role,
            'iat' => CarbonImmutable::now()->timestamp,
            'exp' => $expiration,
        ]);

        return response()->json([
            'token' => $jeton,
            'token_type' => 'Bearer',
            'expires_at' => $expiration,
            'utilisateur' => [
                'id' => $utilisateur->id,
                'nom' => $utilisateur->name,
                'email' => $utilisateur->email,
                'role' => $utilisateur->role,
            ],
        ], 201);
    }

    public function connexion(Request $requete): JsonResponse
    {
        $donneesValidees = $requete->validate([
            'email' => ['required', 'email'],
            'mot_de_passe' => ['required', 'string'],
        ]);

        $utilisateur = User::query()->where('email', $donneesValidees['email'])->first();

        if (! $utilisateur || ! Hash::check($donneesValidees['mot_de_passe'], $utilisateur->password)) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 401);
        }

        $expiration = CarbonImmutable::now()->addHours(8)->timestamp;

        $jeton = $this->serviceJwt->generer([
            'sub' => $utilisateur->id,
            'email' => $utilisateur->email,
            'role' => $utilisateur->role,
            'iat' => CarbonImmutable::now()->timestamp,
            'exp' => $expiration,
        ]);

        return response()->json([
            'token' => $jeton,
            'token_type' => 'Bearer',
            'expires_at' => $expiration,
            'utilisateur' => [
                'id' => $utilisateur->id,
                'nom' => $utilisateur->name,
                'email' => $utilisateur->email,
                'role' => $utilisateur->role,
            ],
        ]);
    }

    public function profil(Request $requete): JsonResponse
    {
        $utilisateur = $requete->user();

        return response()->json([
            'id' => $utilisateur->id,
            'nom' => $utilisateur->name,
            'email' => $utilisateur->email,
            'role' => $utilisateur->role,
        ]);
    }

    public function deconnexion(Request $requete): JsonResponse
    {
        $jeton = $requete->bearerToken();

        if ($jeton) {
            try {
                $payload = $this->serviceJwt->decoder($jeton);
                $expiration = (int) ($payload['exp'] ?? CarbonImmutable::now()->addHours(8)->timestamp);
                $secondesRestantes = max(1, $expiration - CarbonImmutable::now()->timestamp);

                Cache::put($this->cleBlacklist($jeton), true, now()->addSeconds($secondesRestantes));
            } catch (Throwable) {
            }
        }

        return response()->json([
            'message' => 'Déconnexion effectuée.',
        ]);
    }

    private function cleBlacklist(string $jeton): string
    {
        return 'jwt_blacklist:'.hash('sha256', $jeton);
    }
}
