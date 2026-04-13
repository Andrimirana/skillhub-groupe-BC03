<?php

/*
| Projet: SkillHub
| Rôle du fichier: Modèle formation et relation formateur
| Dernière modification: 2026-03-06
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Formation extends Model
{
    use HasFactory;

    // Liste  des champs 
    protected $fillable = [
        'titre',
        'description',
        'category',
        'date',
        'statut',
        'price',
        'duration',
        'level',
        'vues',
        'user_id',
    ];

    protected function casts(): array
    {
        //  casts stabilisent les types entre base de données et réponses JSON
        return [
            'date' => 'date',
            'price' => 'decimal:2',
            'duration' => 'integer',
        ];
    }

    public function formateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class, 'formation_id')->orderBy('ordre');
    }

    public function inscriptions(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'formation_id');
    }
}
