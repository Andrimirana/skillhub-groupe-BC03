<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $table = 'enrollments';

    protected $fillable = [
        'utilisateur_id',
        'formation_id',
        'progression',
        'completed_modules',
        'last_lesson_key',
        'date_inscription',
    ];

    protected function casts(): array
    {
        return [
            'progression'      => 'integer',
            'completed_modules'=> 'array',
            'date_inscription' => 'datetime',
        ];
    }
}
