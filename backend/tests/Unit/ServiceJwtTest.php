<?php

namespace Tests\Unit;

use App\Services\ServiceJwt;
use Carbon\CarbonImmutable;
use RuntimeException;
use Tests\TestCase;

class ServiceJwtTest extends TestCase
{
    public function test_generer_et_decoder_un_jeton_valide(): void
    {
        config(['app.key' => 'cle-test-service-jwt']);
        $serviceJwt = new ServiceJwt();

        $payload = [
            'sub' => 15,
            'email' => 'formateur@test.local',
            'iat' => CarbonImmutable::now()->timestamp,
            'exp' => CarbonImmutable::now()->addMinutes(30)->timestamp,
        ];

        $jeton = $serviceJwt->generer($payload);
        $payloadDecode = $serviceJwt->decoder($jeton);

        $this->assertSame(15, $payloadDecode['sub']);
        $this->assertSame('formateur@test.local', $payloadDecode['email']);
    }

    public function test_decoder_refuse_un_jeton_expire(): void
    {
        config(['app.key' => 'cle-test-service-jwt']);
        $serviceJwt = new ServiceJwt();

        $jetonExpire = $serviceJwt->generer([
            'sub' => 16,
            'exp' => CarbonImmutable::now()->subMinute()->timestamp,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Jeton JWT expiré.');

        $serviceJwt->decoder($jetonExpire);
    }
}
