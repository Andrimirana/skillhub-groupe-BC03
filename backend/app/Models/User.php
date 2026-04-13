<?php

/*
| Projet: SkillHub
| Rôle du fichier: Modèle utilisateur et relations
| Dernière modification: 2026-03-06
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Liste blanche des champs modifiables en création mise à jour
    protected $fillable = [
        'name',
        'email',
        'role',
        'password',
    ];

    // Champs exclus des réponses JSON
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function formations(): HasMany
    {
        return $this->hasMany(Formation::class, 'user_id');
    }

    public function inscriptions(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'utilisateur_id');
    }
}
