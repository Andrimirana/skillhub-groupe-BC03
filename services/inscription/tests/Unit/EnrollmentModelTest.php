<?php

namespace Tests\Unit;

use App\Models\Enrollment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrollment_has_all_fillable_attributes(): void
    {
        $data = [
            'utilisateur_id' => 1,
            'formation_id' => 42,
            'progression' => 0,
            'date_inscription' => now(),
        ];

        $enrollment = Enrollment::create($data);

        $this->assertDatabaseHas('enrollments', [
            'utilisateur_id' => 1,
            'formation_id' => 42
        ]);
        $this->assertEquals(0, $enrollment->progression);
    }

    public function test_enrollment_casts_progression_as_integer(): void
    {
        $enrollment = Enrollment::factory()->create(['progression' => '75']);
        
        $this->assertIsInt($enrollment->progression);
        $this->assertEquals(75, $enrollment->progression);
    }

    public function test_enrollment_casts_date_inscription_as_datetime(): void
    {
        $enrollment = Enrollment::factory()->create([
            'date_inscription' => '2026-05-06 10:00:00'
        ]);
        
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $enrollment->date_inscription);
        $this->assertEquals('2026-05-06', $enrollment->date_inscription->toDateString());
    }

    public function test_enrollment_can_be_updated(): void
    {
        $enrollment = Enrollment::factory()->create(['progression' => 0]);
        
        $enrollment->update(['progression' => 50]);
        
        $this->assertEquals(50, $enrollment->fresh()->progression);
    }

    public function test_enrollment_can_be_deleted(): void
    {
        $enrollment = Enrollment::factory()->create();
        $id = $enrollment->id;
        
        $enrollment->delete();
        
        $this->assertDatabaseMissing('enrollments', ['id' => $id]);
    }

    public function test_enrollment_progression_boundaries(): void
    {
        $enrollment = Enrollment::factory()->create(['progression' => 0]);
        
        $enrollment->update(['progression' => 100]);
        $this->assertEquals(100, $enrollment->fresh()->progression);
        
        $enrollment->update(['progression' => 0]);
        $this->assertEquals(0, $enrollment->fresh()->progression);
    }

    public function test_enrollment_uses_correct_table_name(): void
    {
        $enrollment = new Enrollment();
        
        $this->assertEquals('enrollments', $enrollment->getTable());
    }
}
