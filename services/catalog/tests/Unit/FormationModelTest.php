<?php

namespace Tests\Unit;

use App\Models\Formation;
use App\Models\Module;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormationModelTest extends TestCase
{
    use RefreshDatabase;

    // Vérifie que tous les champs fillable du modèle Formation sont bien persistés en base.
    public function test_formation_has_all_fillable_attributes(): void
    {
        $data = [
            'titre' => 'Formation Test',
            'description' => 'Description test',
            'category' => 'dev',
            'date' => '2026-06-01',
            'statut' => 'Publié',
            'price' => 99.99,
            'duration' => 10,
            'level' => 'beginner',
            'vues' => 100,
            'user_id' => 1,
            'formateur_nom' => 'Alice',
            'apprenants_count' => 5,
        ];

        $formation = Formation::create($data);

        $this->assertDatabaseHas('formations', ['titre' => 'Formation Test']);
        $this->assertEquals('Formation Test', $formation->titre);
        $this->assertEquals(99.99, $formation->price);
    }

    // Vérifie que le champ date est bien casté en instance Carbon par Eloquent.
    public function test_formation_casts_date_correctly(): void
    {
        $formation = Formation::factory()->create(['date' => '2026-07-15']);
        
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $formation->date);
        $this->assertEquals('2026-07-15', $formation->date->toDateString());
    }

    // Vérifie que le prix est casté en décimal sous forme de chaîne avec deux décimales.
    public function test_formation_casts_price_as_decimal(): void
    {
        $formation = Formation::factory()->create(['price' => 149.50]);
        
        $this->assertIsString($formation->price);
        $this->assertEquals('149.50', $formation->price);
    }

    // Vérifie que la durée est castée en entier même quand fournie sous forme de chaîne.
    public function test_formation_casts_duration_as_integer(): void
    {
        $formation = Formation::factory()->create(['duration' => '15']);
        
        $this->assertIsInt($formation->duration);
        $this->assertEquals(15, $formation->duration);
    }

    // Vérifie que la relation HasMany vers les modules est bien définie sur la Formation.
    public function test_formation_has_modules_relationship(): void
    {
        $formation = Formation::factory()->create();
        Module::factory()->count(3)->create(['formation_id' => $formation->id]);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $formation->modules());
        $this->assertCount(3, $formation->modules);
    }

    // Vérifie que les modules d'une formation sont triés par leur champ ordre croissant.
    public function test_modules_are_ordered_by_ordre(): void
    {
        $formation = Formation::factory()->create();
        Module::factory()->create(['formation_id' => $formation->id, 'ordre' => 3, 'titre' => 'Third']);
        Module::factory()->create(['formation_id' => $formation->id, 'ordre' => 1, 'titre' => 'First']);
        Module::factory()->create(['formation_id' => $formation->id, 'ordre' => 2, 'titre' => 'Second']);

        $modules = $formation->modules;

        $this->assertEquals('First', $modules[0]->titre);
        $this->assertEquals('Second', $modules[1]->titre);
        $this->assertEquals('Third', $modules[2]->titre);
    }

    // Vérifie qu'une formation existante peut être mise à jour.
    public function test_formation_can_be_updated(): void
    {
        $formation = Formation::factory()->create(['titre' => 'Original Title']);
        
        $formation->update(['titre' => 'Updated Title']);
        
        $this->assertEquals('Updated Title', $formation->fresh()->titre);
    }

    // Vérifie qu'une formation peut être supprimée et n'est plus présente en base.
    public function test_formation_can_be_deleted(): void
    {
        $formation = Formation::factory()->create();
        $id = $formation->id;
        
        $formation->delete();
        
        $this->assertDatabaseMissing('formations', ['id' => $id]);
    }

    // Vérifie que les valeurs par défaut (vues et nb d'apprenants) sont bien à zéro.
    public function test_formation_default_values(): void
    {
        $formation = Formation::factory()->create([
            'vues' => 0,
            'apprenants_count' => 0,
        ]);

        $this->assertEquals(0, $formation->vues);
        $this->assertEquals(0, $formation->apprenants_count);
    }
}
