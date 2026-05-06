<?php

namespace Tests\Unit;

use App\Http\Middleware\AntiRejeuHmac;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Tests unitaires pour AntiRejeuHmac middleware
 * Vérifie la protection contre les attaques par rejeu avec HMAC
 */
class AntiRejeuHmacTest extends TestCase
{
    private AntiRejeuHmac $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new AntiRejeuHmac();
        Cache::flush();
        
        // Configurer la clé HMAC pour les tests
        config(['app.key' => 'CleDeTestSecrete123!']);
    }

    private function genererSignatureValide(string $contenu, string $nonce, int $timestamp): string
    {
        $donnees = $contenu . $nonce . $timestamp;
        return hash_hmac('sha256', $donnees, 'CleDeTestSecrete123!');
    }

    public function test_request_blocked_when_hmac_signature_missing(): void
    {
        $request = Request::create('/test', 'POST');
        $request->headers->set('X-Nonce', 'test-nonce');
        $request->headers->set('X-Timestamp', time());

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertStringContainsString('manquants', $response->getContent());
    }

    public function test_request_blocked_when_nonce_missing(): void
    {
        $request = Request::create('/test', 'POST');
        $request->headers->set('X-HMAC-Signature', 'fake-signature');
        $request->headers->set('X-Timestamp', time());

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_request_blocked_when_timestamp_missing(): void
    {
        $request = Request::create('/test', 'POST');
        $request->headers->set('X-HMAC-Signature', 'fake-signature');
        $request->headers->set('X-Nonce', 'test-nonce');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_request_blocked_when_timestamp_expired(): void
    {
        $expiredTimestamp = time() - 400; // 400 secondes dans le passé (> 300s limite)
        $nonce = 'test-nonce-' . uniqid();
        $content = '';
        
        $signature = $this->genererSignatureValide($content, $nonce, $expiredTimestamp);

        $request = Request::create('/test', 'POST', [], [], [], [], $content);
        $request->headers->set('X-HMAC-Signature', $signature);
        $request->headers->set('X-Nonce', $nonce);
        $request->headers->set('X-Timestamp', $expiredTimestamp);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertStringContainsString('expirée', $response->getContent());
    }

    public function test_request_blocked_when_nonce_already_used(): void
    {
        $timestamp = time();
        $nonce = 'test-nonce-duplicate';
        $content = '';
        
        $signature = $this->genererSignatureValide($content, $nonce, $timestamp);

        // Marquer le nonce comme déjà utilisé
        Cache::put('nonce_' . $nonce, true, 300);

        $request = Request::create('/test', 'POST', [], [], [], [], $content);
        $request->headers->set('X-HMAC-Signature', $signature);
        $request->headers->set('X-Nonce', $nonce);
        $request->headers->set('X-Timestamp', $timestamp);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertStringContainsString('rejeu', $response->getContent());
    }

    public function test_request_blocked_when_signature_invalid(): void
    {
        $timestamp = time();
        $nonce = 'test-nonce-' . uniqid();
        $content = '{"data":"test"}';
        
        $invalidSignature = 'wrong-signature-value';

        $request = Request::create('/test', 'POST', [], [], [], [], $content);
        $request->headers->set('X-HMAC-Signature', $invalidSignature);
        $request->headers->set('X-Nonce', $nonce);
        $request->headers->set('X-Timestamp', $timestamp);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertStringContainsString('invalide', $response->getContent());
    }

    public function test_request_passes_with_valid_signature(): void
    {
        $timestamp = time();
        $nonce = 'test-nonce-' . uniqid();
        $content = '{"data":"test"}';
        
        $signature = $this->genererSignatureValide($content, $nonce, $timestamp);

        $request = Request::create('/test', 'POST', [], [], [], [], $content);
        $request->headers->set('X-HMAC-Signature', $signature);
        $request->headers->set('X-Nonce', $nonce);
        $request->headers->set('X-Timestamp', $timestamp);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertTrue($content['success']);
        
        // Vérifier que le nonce a été mis en cache
        $this->assertTrue(Cache::has('nonce_' . $nonce));
    }

    public function test_timestamp_within_5_minutes_is_valid(): void
    {
        $timestamp = time() - 250; // 250 secondes dans le passé (< 300s limite)
        $nonce = 'test-nonce-' . uniqid();
        $content = '';
        
        $signature = $this->genererSignatureValide($content, $nonce, $timestamp);

        $request = Request::create('/test', 'POST', [], [], [], [], $content);
        $request->headers->set('X-HMAC-Signature', $signature);
        $request->headers->set('X-Nonce', $nonce);
        $request->headers->set('X-Timestamp', $timestamp);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_future_timestamp_within_5_minutes_is_valid(): void
    {
        $timestamp = time() + 250; // 250 secondes dans le futur (< 300s limite)
        $nonce = 'test-nonce-' . uniqid();
        $content = '';
        
        $signature = $this->genererSignatureValide($content, $nonce, $timestamp);

        $request = Request::create('/test', 'POST', [], [], [], [], $content);
        $request->headers->set('X-HMAC-Signature', $signature);
        $request->headers->set('X-Nonce', $nonce);
        $request->headers->set('X-Timestamp', $timestamp);

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }
}
