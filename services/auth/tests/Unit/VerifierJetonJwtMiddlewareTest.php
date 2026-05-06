<?php

namespace Tests\Unit;

use App\Http\Middleware\VerifierJetonJwt;
use App\Models\User;
use App\Services\ServiceJwt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class VerifierJetonJwtMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private function createMiddleware(): VerifierJetonJwt
    {
        return new VerifierJetonJwt(app(ServiceJwt::class));
    }

    private function generateToken(User $user): string
    {
        return app(ServiceJwt::class)->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() + 3600
        ]);
    }

    public function test_middleware_rejects_request_without_token(): void
    {
        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Jeton manquant', $response->getContent());
    }

    public function test_middleware_accepts_valid_token(): void
    {
        $user = User::factory()->create();
        $token = $this->generateToken($user);

        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $middleware->handle($request, function ($req) {
            return response()->json(['user_id' => $req->user()->id]);
        });

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals($user->id, $data['user_id']);
    }

    public function test_middleware_rejects_blacklisted_token(): void
    {
        $user = User::factory()->create();
        $token = $this->generateToken($user);
        
        Cache::put('jwt_blacklist:' . hash('sha256', $token), true, 3600);

        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_middleware_rejects_invalid_token(): void
    {
        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer invalid.token.here');

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_middleware_rejects_token_for_non_existing_user(): void
    {
        $user = User::factory()->create();
        $token = $this->generateToken($user);
        $user->delete();

        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Utilisateur introuvable', $response->getContent());
    }

    public function test_middleware_injects_user_into_request(): void
    {
        $user = User::factory()->create(['name' => 'Test User', 'email' => 'test@test.com']);
        $token = $this->generateToken($user);

        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $token);

        $capturedUser = null;
        $middleware->handle($request, function ($req) use (&$capturedUser) {
            $capturedUser = $req->user();
            return response()->json(['ok' => true]);
        });

        $this->assertNotNull($capturedUser);
        $this->assertEquals($user->id, $capturedUser->id);
        $this->assertEquals('Test User', $capturedUser->name);
    }

    public function test_middleware_rejects_expired_token(): void
    {
        $user = User::factory()->create();
        $expiredToken = app(ServiceJwt::class)->generer([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'exp' => time() - 100 // Expired 100 seconds ago
        ]);

        $middleware = $this->createMiddleware();
        $request = Request::create('/test', 'GET');
        $request->headers->set('Authorization', 'Bearer ' . $expiredToken);

        $response = $middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(403, $response->getStatusCode());
    }
}
