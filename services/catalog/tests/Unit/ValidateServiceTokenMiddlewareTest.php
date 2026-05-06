<?php

namespace Tests\Unit;

use App\Http\Middleware\ValidateServiceToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ValidateServiceTokenMiddlewareTest extends TestCase
{
    public function test_middleware_rejects_request_without_token(): void
    {
        $middleware = new ValidateServiceToken();
        $request = Request::create('/test', 'GET');

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Jeton manquant', $response->getContent());
    }

    public function test_middleware_rejects_invalid_token(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => false], 401),
        ]);

        $middleware = new ValidateServiceToken();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer invalid_token');

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_middleware_accepts_valid_token(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response([
                'valid' => true,
                'user' => ['id' => 1, 'nom' => 'Test', 'email' => 'test@test.com', 'role' => 'apprenant']
            ], 200),
        ]);

        $middleware = new ValidateServiceToken();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer valid_token');

        $response = $middleware->handle($request, fn ($req) => response()->json(['auth_user' => $req->input('auth_user')]));

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Test', $data['auth_user']['nom']);
    }

    public function test_middleware_injects_user_data_into_request(): void
    {
        $userData = ['id' => 1, 'nom' => 'Alice', 'email' => 'alice@test.com', 'role' => 'formateur'];
        
        Http::fake([
            '*/api/validate-token' => Http::response(['valid' => true, 'user' => $userData], 200),
        ]);

        $middleware = new ValidateServiceToken();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer token');

        $capturedRequest = null;
        $middleware->handle($request, function ($req) use (&$capturedRequest) {
            $capturedRequest = $req;
            return response()->json(['ok' => true]);
        });

        $this->assertEquals($userData, $capturedRequest->input('auth_user'));
    }

    public function test_middleware_handles_auth_service_unavailable(): void
    {
        Http::fake([
            '*/api/validate-token' => Http::response([], 500),
        ]);

        $middleware = new ValidateServiceToken();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer token');

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(401, $response->getStatusCode());
    }
}
