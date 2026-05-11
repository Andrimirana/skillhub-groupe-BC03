<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class AuthControllerAdditionalTest extends TestCase
{
    use RefreshDatabase;

    private function genererJetonPourTest(User $user): string
    {
        return app(\App\Services\ServiceJwt::class)->generer([
            'sub'   => $user->id,
            'email' => $user->email,
            'role'  => $user->role,
            'exp'   => time() + 3600
        ]);
    }
    // Methode pour générer les entêtes de sécurité
    private function genererEntetesSecurite(array $donnees = []): array
    {
        $payload = json_encode($donnees);
        $nonce = uniqid('test_', true);
        $timestamp = time();
        $masterKey = env('APP_MASTER_KEY', 'CleDeTestSecrete123!');
        $signature = hash_hmac('sha256', $payload . $nonce . $timestamp, $masterKey);

        return [
            'X-Nonce' => $nonce,
            'X-Timestamp' => $timestamp,
            'X-HMAC-Signature' => $signature,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
    }

    // Vérifie que la route de profil retourne les données correctes de l'utilisateur authentifié.
    public function test_profil_returns_correct_user_data(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'formateur'
        ]);
        $jeton = $this->genererJetonPourTest($user);

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->getJson('/api/profil');
        $response->assertStatus(200)
            ->assertJson([
                'nom' => 'Test User',
                'email' => 'test@example.com',
                'role' => 'formateur'
            ]);
    }

    public function test_deconnexion_requires_authentication(): void
    {
        $response = $this->postJson('/api/logout');
        $response->assertStatus(401);
    }

    public function test_deconnexion_with_invalid_token_returns_403(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid_token')->postJson('/api/logout');
        $response->assertStatus(403);
    }

    // Vérifie que la validation d'un token avec un utilisateur supprimé échoue correctement.

    public function test_validation_interne_echoue_si_utilisateur_supprime(): void
    {
        $user = User::factory()->create();
        $jeton = $this->genererJetonPourTest($user);
        $user->delete();

        $response = $this->withHeader('Authorization', 'Bearer ' . $jeton)->postJson('/api/validate-token');
        $response->assertStatus(401)->assertJson(['valid' => false, 'message' => 'Utilisateur introuvable.']);
    }

    // Vérifie que l'inscription avec des données valides crée un utilisateur et retourne un token.
    public function test_inscription_returns_token_and_user_info(): void
    {
        $donnees = ['nom' => 'Jean Dupont', 'email' => 'jean@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        
        $response->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'token_type',
                'expires_at',
                'utilisateur' => ['id', 'nom', 'email', 'role']
            ]);
    }

    public function test_connexion_returns_token_with_correct_type(): void
    {
        User::factory()->create(['email' => 'jean@example.com', 'password' => Hash::make('Password1!')]);
        $donnees = ['email' => 'jean@example.com', 'mot_de_passe' => 'Password1!'];
        
        $response = $this->postJson('/api/login', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(200)->assertJsonPath('token_type', 'Bearer');
    }

    public function test_changement_mot_de_passe_requires_authentication(): void
    {
        $response = $this->putJson('/api/change-password', [
            'ancien_mot_de_passe' => 'OldPass1!',
            'nouveau_mot_de_passe' => 'NewPass2@'
        ]);
        $response->assertStatus(401);
    }

    // Vérifie que l'inscription échoue si le nom est manquant.

    public function test_inscription_echoue_si_nom_manquant(): void
    {
        $donnees = ['email' => 'test@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['nom']);
    }

    // Vérifie que l'inscription échoue si le mot de passe est trop court.
    public function test_connexion_validation_requires_email_and_password(): void
    {
        $donnees = ['email' => 'test@example.com'];
        $response = $this->postJson('/api/login', $donnees, $this->genererEntetesSecurite($donnees));
        $response->assertStatus(422)->assertJsonValidationErrors(['mot_de_passe']);
    }

    public function test_token_expiration_is_set_correctly(): void
    {
        $donnees = ['nom' => 'Test', 'email' => 'test@example.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];
        $response = $this->postJson('/api/register', $donnees, $this->genererEntetesSecurite($donnees));
        
        $data = $response->json();
        $expectedExpiration = time() + (8 * 3600);
        $this->assertEqualsWithDelta($expectedExpiration, $data['expires_at'], 10);
    }

    public function test_profil_requires_valid_token(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid_token')->getJson('/api/profil');
        $response->assertStatus(403);
    }

    // Vérifie que la validation d'un token avec un utilisateur supprimé échoue correctement.
    public function test_validation_token_with_invalid_format(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer abc.def.ghi')->postJson('/api/validate-token');
        $response->assertStatus(401)->assertJson(['valid' => false]);
    }

    // Vérifie que la validation d'un token avec un utilisateur supprimé échoue correctement.
    public function test_multiple_roles_can_register(): void
    {
        $formateur = ['nom' => 'Formateur', 'email' => 'form@test.com', 'mot_de_passe' => 'Password1!', 'role' => 'formateur'];
        $apprenant = ['nom' => 'Apprenant', 'email' => 'app@test.com', 'mot_de_passe' => 'Password1!', 'role' => 'apprenant'];

        $r1 = $this->postJson('/api/register', $formateur, $this->genererEntetesSecurite($formateur));
        $r2 = $this->postJson('/api/register', $apprenant, $this->genererEntetesSecurite($apprenant));

        $r1->assertStatus(201);
        $r2->assertStatus(201);
        $this->assertDatabaseCount('users', 2);
    }
}
