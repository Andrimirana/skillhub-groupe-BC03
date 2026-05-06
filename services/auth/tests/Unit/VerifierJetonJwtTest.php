<?php

namespace Tests\Unit;

use App\Http\Middleware\VerifierJetonJwt;
use App\Models\User;
use App\Services\ServiceJwt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Tests unitaires pour VerifierJetonJwt middleware
 * Teste la vérification JWT, blacklist, et injection utilisateur
 */
class VerifierJetonJwtTest extends TestCase
{
    use RefreshDatabase;

    private VerifierJetonJwt $middleware;
    private ServiceJwt $serviceJwt;

    protected function setUp(): void
    {
        parent::setUp();
        $this->serviceJwt = new ServiceJwt('TestSecretKey123!');
        $this->middleware = new VerifierJetonJwt($this->serviceJwt);
    }

    public function test_request_rejected_when_token_missing(): void
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('manquant', $data['message'] ?? '');
    }

    public function test_request_rejected_when_token_blacklisted(): void
    {
        $user = User::factory()->create();
        $token = $this->serviceJwt->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + 3600,
        ]);

        // Ajouter le token à la blacklist
        $blacklistKey = 'jwt_blacklist:' . hash('sha256', $token);
        Cache::put($blacklistKey, true, 3600);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('invalide', $data['message'] ?? '');
    }

    public function test_request_rejected_when_token_invalid(): void
    {
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer invalid-token-format');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('invalide', $data['message'] ?? '');
    }

    public function test_request_rejected_when_token_expired(): void
    {
        $user = User::factory()->create();
        $expiredToken = $this->serviceJwt->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() - 3600, // Token expiré (1h dans le passé)
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $expiredToken);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('invalide', $data['message'] ?? '');
    }

    public function test_request_rejected_when_user_not_found(): void
    {
        $nonExistentUserId = 9999;
        $token = $this->serviceJwt->generer([
            'sub' => $nonExistentUserId,
            'email' => 'ghost@example.com',
            'role' => 'apprenant',
            'exp' => time() + 3600,
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('introuvable', $data['message'] ?? '');
    }

    public function test_request_passes_with_valid_token_and_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'formateur',
        ]);

        $token = $this->serviceJwt->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + 3600,
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $resolvedUser = null;

        $response = $this->middleware->handle($request, function ($req) use (&$resolvedUser) {
            $resolvedUser = $req->user();
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertNotNull($resolvedUser);
        $this->assertEquals($user->id, $resolvedUser->id);
        $this->assertEquals('test@example.com', $resolvedUser->email);
    }

    public function test_user_resolver_is_set_correctly(): void
    {
        $user = User::factory()->create(['email' => 'verify@example.com']);
        $token = $this->serviceJwt->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + 3600,
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $this->middleware->handle($request, function ($req) {
            $this->assertInstanceOf(User::class, $req->user());
            return response()->json(['success' => true]);
        });

        $this->assertTrue(true);
    }

    public function test_token_without_bearer_prefix_is_rejected(): void
    {
        $user = User::factory()->create();
        $token = $this->serviceJwt->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + 3600,
        ]);

        $request = Request::create('/test', 'GET');
        // Token sans préfixe "Bearer "
        $request->headers->set('Authorization', $token);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_token_with_missing_sub_claim(): void
    {
        // Token sans claim 'sub'
        $token = $this->serviceJwt->generer([
            'email' => 'test@example.com',
            'role' => 'apprenant',
            'exp' => time() + 3600,
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        // Sans 'sub', idUtilisateur sera 0, utilisateur introuvable
        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_blacklist_key_generation_is_consistent(): void
    {
        $token = 'test-token-example';
        $expectedKey = 'jwt_blacklist:' . hash('sha256', $token);

        // Test en blacklistant puis vérifiant
        Cache::put($expectedKey, true, 60);

        $this->assertTrue(Cache::has($expectedKey));
        $this->assertEquals(true, Cache::get($expectedKey));
    }
}
