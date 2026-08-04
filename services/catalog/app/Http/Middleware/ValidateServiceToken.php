<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class ValidateServiceToken
{
    public function handle(Request $requete, Closure $suivant): Response
    {
        $jeton = $requete->bearerToken();

        if (! $jeton) {
            return response()->json(['message' => 'Jeton manquant.'], 401);
        }

        $urlAuth = config('services.auth.url');

        try {
            $reponseAuth = Http::timeout(3)->withToken($jeton)->post("{$urlAuth}/api/validate-token");
        } catch (ConnectionException) {
            return response()->json(['message' => 'Session invalide ou expirée.'], 401);
        }

        if (! $reponseAuth->ok() || ! $reponseAuth->json('valid')) {
            return response()->json(['message' => 'Non autorisé.'], 401);
        }

        $requete->merge(['auth_user' => $reponseAuth->json('user')]);

        return $suivant($requete);
    }
}
