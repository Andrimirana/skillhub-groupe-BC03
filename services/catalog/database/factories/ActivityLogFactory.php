<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory pour les logs d'activité MongoDB
 */
class ActivityLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event' => $this->faker->randomElement([
                'course_created',
                'course_updated',
                'course_viewed',
                'module_added',
                'enrollment_created'
            ]),
            'action' => $this->faker->randomElement([
                'course_created',
                'course_updated',
                'course_viewed',
                'module_added',
                'enrollment_created'
            ]),
            'user_id' => $this->faker->numberBetween(1, 100),
            'course_id' => $this->faker->numberBetween(1, 50),
            'updated_by' => $this->faker->numberBetween(1, 100),
            'old_values' => null,
            'new_values' => [
                'titre' => $this->faker->sentence(),
                'status' => $this->faker->randomElement(['À venir', 'En cours', 'Terminé']),
            ],
            'timestamp' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
