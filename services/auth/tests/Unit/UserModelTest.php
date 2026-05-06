<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_model_has_fillable_attributes(): void
    {
        $data = [
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'password' => Hash::make('Password1!'),
            'role' => 'formateur',
        ];

        $user = User::create($data);

        $this->assertDatabaseHas('users', [
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'role' => 'formateur',
        ]);
        $this->assertEquals('Jean Dupont', $user->name);
        $this->assertEquals('formateur', $user->role);
    }

    public function test_user_password_is_hashed(): void
    {
        $user = User::factory()->create(['password' => Hash::make('TestPassword123!')]);
        
        $this->assertTrue(Hash::check('TestPassword123!', $user->password));
        $this->assertNotEquals('TestPassword123!', $user->password);
    }

    public function test_user_can_be_formateur(): void
    {
        $user = User::factory()->create(['role' => 'formateur']);
        
        $this->assertEquals('formateur', $user->role);
    }

    public function test_user_can_be_apprenant(): void
    {
        $user = User::factory()->create(['role' => 'apprenant']);
        
        $this->assertEquals('apprenant', $user->role);
    }

    public function test_user_email_must_be_unique(): void
    {
        User::factory()->create(['email' => 'unique@example.com']);
        
        $this->expectException(\Illuminate\Database\QueryException::class);
        User::factory()->create(['email' => 'unique@example.com']);
    }

    public function test_user_can_be_updated(): void
    {
        $user = User::factory()->create(['name' => 'Original Name']);
        
        $user->update(['name' => 'Updated Name']);
        
        $this->assertEquals('Updated Name', $user->fresh()->name);
    }

    public function test_user_can_be_deleted(): void
    {
        $user = User::factory()->create();
        $id = $user->id;
        
        $user->delete();
        
        $this->assertDatabaseMissing('users', ['id' => $id]);
    }

    public function test_user_has_hidden_password(): void
    {
        $user = User::factory()->create();
        
        $array = $user->toArray();
        
        $this->assertArrayNotHasKey('password', $array);
    }

    public function test_user_password_can_be_changed(): void
    {
        $user = User::factory()->create(['password' => Hash::make('OldPassword1!')]);
        
        $user->update(['password' => Hash::make('NewPassword2@')]);
        
        $this->assertTrue(Hash::check('NewPassword2@', $user->fresh()->password));
        $this->assertFalse(Hash::check('OldPassword1!', $user->fresh()->password));
    }
}
