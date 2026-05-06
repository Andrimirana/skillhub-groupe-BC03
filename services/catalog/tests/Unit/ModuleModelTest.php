<?php

namespace Tests\Unit;

use App\Models\Formation;
use App\Models\Module;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_module_has_all_fillable_attributes(): void
    {
        $formation = Formation::factory()->create();
        
        $data = [
            'titre' => 'Module Test',
            'contenu' => 'Contenu du module de test',
            'ordre' => 1,
            'formation_id' => $formation->id,
        ];

        $module = Module::create($data);

        $this->assertDatabaseHas('modules', ['titre' => 'Module Test']);
        $this->assertEquals('Module Test', $module->titre);
        $this->assertEquals(1, $module->ordre);
    }

    public function test_module_casts_ordre_as_integer(): void
    {
        $formation = Formation::factory()->create();
        $module = Module::factory()->create([
            'formation_id' => $formation->id,
            'ordre' => '5'
        ]);
        
        $this->assertIsInt($module->ordre);
        $this->assertEquals(5, $module->ordre);
    }

    public function test_module_belongs_to_formation(): void
    {
        $formation = Formation::factory()->create();
        $module = Module::factory()->create(['formation_id' => $formation->id]);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $module->formation());
        $this->assertEquals($formation->id, $module->formation->id);
    }

    public function test_module_can_be_updated(): void
    {
        $formation = Formation::factory()->create();
        $module = Module::factory()->create([
            'formation_id' => $formation->id,
            'titre' => 'Original'
        ]);
        
        $module->update(['titre' => 'Updated']);
        
        $this->assertEquals('Updated', $module->fresh()->titre);
    }

    public function test_module_can_be_deleted(): void
    {
        $formation = Formation::factory()->create();
        $module = Module::factory()->create(['formation_id' => $formation->id]);
        $id = $module->id;
        
        $module->delete();
        
        $this->assertDatabaseMissing('modules', ['id' => $id]);
    }

    public function test_module_ordre_can_be_changed(): void
    {
        $formation = Formation::factory()->create();
        $module = Module::factory()->create([
            'formation_id' => $formation->id,
            'ordre' => 1
        ]);
        
        $module->update(['ordre' => 5]);
        
        $this->assertEquals(5, $module->fresh()->ordre);
    }
}
