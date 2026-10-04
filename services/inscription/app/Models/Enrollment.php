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
        'utilisateur_nom',
        'formation_id',
        'progression',
        'completed_modules',
        'last_lesson_key',
        'date_inscription',
        'avis_note',
        'avis_commentaire',
        'avis_date',
    ];

    protected function casts(): array
    {
        return [
            'progression'      => 'integer',
            'completed_modules'=> 'array',
            'date_inscription' => 'datetime',
            'avis_note'        => 'integer',
            'avis_date'        => 'datetime',
        ];
    }
}
