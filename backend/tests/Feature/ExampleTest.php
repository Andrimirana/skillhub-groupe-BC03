<?php

/*
| Projet: SkillHub
| Rôle du fichier: Test feature basique de disponibilité
| Dernière modification: 2026-03-06
*/

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
