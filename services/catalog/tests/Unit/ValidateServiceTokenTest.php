<?php

namespace Tests\Unit;

use App\Http\Middleware\ValidateServiceToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Tests unitaires pour ValidateServiceToken middleware
 * Vérifie la validation des tokens JWT auprès du service Auth
 */
class ValidateServiceTokenTest extends TestCase
{
    private ValidateServiceToken $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new ValidateServiceToken();
        
        config(['services.auth.url' => 'http://auth-service']);
    }

    public function test_request_blocked_when_token_missing(): void
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertStringContainsString('manquant', $content['message']);
    }

    public function test_request_blocked_when_token_invalid(): void
    {
        Http::fake([
            'http://auth-service/api/validate-token' => Http::response(['valid' => false], 401),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer invalid-token');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertStringContainsString('autorisé', $content['message']);
    }

    public function test_request_blocked_when_auth_service_returns_error(): void
    {
        Http::fake([
            'http://auth-service/api/validate-token' => Http::response([], 500),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer some-token');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_request_passes_with_valid_token(): void
    {
        $userData = [
            'id' => 1,
            'nom' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'formateur'
        ];

        Http::fake([
            'http://auth-service/api/validate-token' => Http::response([
                'valid' => true,
                'user' => $userData
            ], 200),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer valid-token');

        $response = $this->middleware->handle($request, function ($req) use ($userData) {
            // Vérifier que les données utilisateur ont été ajoutées à la requête
            $this->assertEquals($userData, $req->input('auth_user'));
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_user_data_injected_into_request(): void
    {
        $userData = [
            'id' => 42,
            'nom' => 'Alice Trainer',
            'email' => 'alice@example.com',
            'role' => 'formateur'
        ];

        Http::fake([
            'http://auth-service/api/validate-token' => Http::response([
                'valid' => true,
                'user' => $userData
            ], 200),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer valid-token');

        $capturedUser = null;

        $this->middleware->handle($request, function ($req) use (&$capturedUser) {
            $capturedUser = $req->input('auth_user');
            return response()->json(['success' => true]);
        });

        $this->assertNotNull($capturedUser);
        $this->assertEquals(42, $capturedUser['id']);
        $this->assertEquals('Alice Trainer', $capturedUser['nom']);
        $this->assertEquals('formateur', $capturedUser['role']);
    }

    public function test_bearer_token_extracted_correctly(): void
    {
        Http::fake([
            'http://auth-service/api/validate-token' => Http::response([
                'valid' => true,
                'user' => ['id' => 1, 'role' => 'apprenant']
            ], 200),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer test-token-value');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
        
        // Vérifier que le token a été envoyé au service auth
        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'Bearer test-token-value');
        });
    }
}
