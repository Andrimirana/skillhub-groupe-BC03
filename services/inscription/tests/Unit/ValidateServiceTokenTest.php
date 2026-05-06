<?php

namespace Tests\Unit;

use App\Http\Middleware\ValidateServiceToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Tests unitaires pour ValidateServiceToken middleware (inscription service)
 * Identique à catalog mais séparé pour couvrir les deux services
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

    public function test_request_rejected_without_bearer_token(): void
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('manquant', $data['message'] ?? '');
    }

    public function test_request_rejected_when_auth_service_returns_invalid(): void
    {
        Http::fake([
            'http://auth-service/api/validate-token' => Http::response(['valid' => false], 401),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer bad-token');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_request_accepted_with_valid_token_and_user_data(): void
    {
        $userData = ['id' => 10, 'nom' => 'Bob', 'role' => 'apprenant'];

        Http::fake([
            'http://auth-service/api/validate-token' => Http::response([
                'valid' => true,
                'user' => $userData
            ], 200),
        ]);

        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer valid-token');

        $processedUser = null;

        $response = $this->middleware->handle($request, function ($req) use (&$processedUser) {
            $processedUser = $req->input('auth_user');
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals($userData, $processedUser);
    }
}
