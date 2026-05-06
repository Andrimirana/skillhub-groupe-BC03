<?php

namespace Tests\Unit;

use App\Services\ServiceJwt;
use Carbon\CarbonImmutable;
use RuntimeException;
use Tests\TestCase;

/**
 * Tests unitaires pour ServiceJwt
 * Vérifie la génération et validation des JWT signés en HMAC-SHA256
 */
class ServiceJwtTest extends TestCase
{
    private ServiceJwt $serviceJwt;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Configurer la clé secrète pour les tests
        config(['app.key' => 'test-secret-key-for-jwt-signing']);
        
        $this->serviceJwt = new ServiceJwt();
    }

    public function test_constructor_throws_exception_when_app_key_is_empty(): void
    {
        config(['app.key' => '']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('La clé d\'application est absente');

        new ServiceJwt();
    }

    public function test_generer_creates_valid_jwt_with_three_segments(): void
    {
        $payload = [
            'sub' => 1,
            'email' => 'test@example.com',
            'role' => 'formateur',
        ];

        $token = $this->serviceJwt->generer($payload);

        // Un JWT doit avoir exactement 3 segments séparés par des points
        $segments = explode('.', $token);
        $this->assertCount(3, $segments);
        $this->assertNotEmpty($segments[0]); // Header
        $this->assertNotEmpty($segments[1]); // Payload
        $this->assertNotEmpty($segments[2]); // Signature
    }

    public function test_decoder_successfully_decodes_valid_token(): void
    {
        $payload = [
            'sub' => 1,
            'email' => 'test@example.com',
            'role' => 'formateur',
            'exp' => CarbonImmutable::now()->addHour()->timestamp,
        ];

        $token = $this->serviceJwt->generer($payload);
        $decoded = $this->serviceJwt->decoder($token);

        $this->assertEquals(1, $decoded['sub']);
        $this->assertEquals('test@example.com', $decoded['email']);
        $this->assertEquals('formateur', $decoded['role']);
    }

    public function test_decoder_throws_exception_for_invalid_jwt_format(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Jeton JWT invalide');

        $this->serviceJwt->decoder('invalid.token');
    }

    public function test_decoder_throws_exception_for_tampered_signature(): void
    {
        $payload = [
            'sub' => 1,
            'email' => 'test@example.com',
            'exp' => CarbonImmutable::now()->addHour()->timestamp,
        ];

        $token = $this->serviceJwt->generer($payload);
        
        // Modifier la signature (dernier segment)
        $segments = explode('.', $token);
        $segments[2] = 'tampered-signature';
        $tamperedToken = implode('.', $segments);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Signature JWT invalide');

        $this->serviceJwt->decoder($tamperedToken);
    }

    public function test_decoder_throws_exception_for_expired_token(): void
    {
        $payload = [
            'sub' => 1,
            'email' => 'test@example.com',
            'exp' => CarbonImmutable::now()->subHour()->timestamp, // Expiré il y a 1 heure
        ];

        $token = $this->serviceJwt->generer($payload);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Jeton JWT expiré');

        $this->serviceJwt->decoder($token);
    }

    public function test_decoder_throws_exception_for_invalid_payload(): void
    {
        // Créer manuellement un JWT avec payload invalide
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $invalidPayload = base64_encode('not-json');
        $signature = hash_hmac('sha256', $header . '.' . $invalidPayload, 'test-secret-key-for-jwt-signing', true);
        $signatureEncoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
        
        $invalidToken = $header . '.' . $invalidPayload . '.' . $signatureEncoded;

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Payload JWT invalide');

        $this->serviceJwt->decoder($invalidToken);
    }

    public function test_token_remains_valid_before_expiration(): void
    {
        $payload = [
            'sub' => 1,
            'email' => 'test@example.com',
            'exp' => CarbonImmutable::now()->addMinutes(5)->timestamp,
        ];

        $token = $this->serviceJwt->generer($payload);
        $decoded = $this->serviceJwt->decoder($token);

        $this->assertIsArray($decoded);
        $this->assertEquals(1, $decoded['sub']);
    }

    public function test_token_without_expiration_is_valid(): void
    {
        $payload = [
            'sub' => 1,
            'email' => 'test@example.com',
            'role' => 'apprenant',
        ];

        $token = $this->serviceJwt->generer($payload);
        $decoded = $this->serviceJwt->decoder($token);

        $this->assertIsArray($decoded);
        $this->assertArrayNotHasKey('exp', $decoded);
    }

    public function test_different_payloads_generate_different_tokens(): void
    {
        $payload1 = ['sub' => 1, 'email' => 'user1@test.com'];
        $payload2 = ['sub' => 2, 'email' => 'user2@test.com'];

        $token1 = $this->serviceJwt->generer($payload1);
        $token2 = $this->serviceJwt->generer($payload2);

        $this->assertNotEquals($token1, $token2);
    }

    public function test_same_payload_generates_same_token(): void
    {
        $payload = ['sub' => 1, 'email' => 'test@example.com', 'iat' => 1234567890];

        $token1 = $this->serviceJwt->generer($payload);
        $token2 = $this->serviceJwt->generer($payload);

        $this->assertEquals($token1, $token2);
    }
}
