<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model ActivityLog
 * 
 * Représente les logs d'activité stockés dans MongoDB
 * Enregistre chaque action utilisateur dans la plateforme
 */
class ActivityLog extends Model
{
    // Utiliser MongoDB comme connexion
    protected $connection = 'mongodb';
    protected $collection = 'activity_logs';

    // Pas de timestamps Laravel (on utilise 'timestamp' personnalisé)
    public $timestamps = false;

    // Champs assignables en masse
    protected $fillable = [
        'userId',
        'userEmail',
        'action',
        'resourceType',
        'resourceId',
        'resourceTitle',
        'details',
        'timestamp',
        'ipAddress',
        'userAgent',
        'duration',
    ];

    // Casting des champs
    protected $casts = [
        'timestamp' => 'datetime',
        'details' => 'json',
        'duration' => 'integer',
    ];

    /**
     * Scope: Filtrer par utilisateur
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('userId', (string)$userId);
    }

    /**
     * Scope: Filtrer par action
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Filtrer par ressource
     */
    public function scopeByResource($query, $resourceType, $resourceId)
    {
        return $query->where('resourceType', $resourceType)->where('resourceId', $resourceId);
    }

    /**
     * Scope: Logs récents (par défaut 7 jours)
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('timestamp', '>=', now()->subDays($days));
    }

    /**
     * Obtenir les logs de l'année courante
     */
    public function scopeThisYear($query)
    {
        return $query->where('timestamp', '>=', now()->startOfYear());
    }

    /**
     * Obtenir les logs du mois courant
     */
    public function scopeThisMonth($query)
    {
        return $query->where('timestamp', '>=', now()->startOfMonth());
    }

    /**
     * Obtenir les logs d'aujourd'hui
     */
    public function scopeToday($query)
    {
        return $query->where('timestamp', '>=', now()->startOfDay());
    }
}
