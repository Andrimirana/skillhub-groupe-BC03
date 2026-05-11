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

    // Méthode utilitaire pour générer une signature HMAC valide
    private function genererSignatureValide(string $contenu, string $nonce, int $timestamp): string
    {
        $donnees = $contenu . $nonce . $timestamp;
        return hash_hmac('sha256', $donnees, 'CleDeTestSecrete123!');
    }

    // Test pour s'assurer que la requête est bloquée si la signature HMAC est manquante
    public function test_request_blocked_when_hmac_signature_missing(): void
    {
        $request = Request::create('/test', 'POST');
        $request->headers->set('X-Nonce', 'test-nonce');
        $request->headers->set('X-Timestamp', time());

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true]);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('manquant', $data['message'] ?? '');
    }

    // Test pour s'assurer que la requête est bloquée si le nonce est manquant
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

    // Test pour s'assurer que la requête est bloquée si le timestamp est manquant
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

    // Test pour s'assurer que la requête est bloquée si le timestamp est trop dans le passe
    public function test_request_blocked_when_timestamp_expired(): void
    {
        $expiredTimestamp = time() - 400; 
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
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('expir', $data['message'] ?? '');
    }

    // Test pour s'assurer que la requête est bloquée si le timestamp est trop dans le futur
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
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('rejeu', $data['message'] ?? '');
    }


    // Test pour s'assurer que la requête est bloquée si la signature HMAC est invalide
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
        $data = json_decode($response->getContent(), true);
        $this->assertStringContainsString('invalide', $data['message'] ?? '');
    }

    // Test pour s'assurer que la requête passe avec une signature HMAC valide et un nonce unique
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


    // Test pour s'assurer que la requête passe avec un timestamp dans le futur mais toujours dans la limite de 5 minutes
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
