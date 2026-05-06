<?php

namespace App\Models;

use Database\Factories\ActivityLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Jenssegers\Mongodb\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'activity_logs';

    protected $fillable = [
        'event',
        'user_id',
        'course_id',
        'updated_by',
        'old_values',
        'new_values',
        'timestamp',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'timestamp' => 'datetime',
    ];

    protected static function newFactory(): ActivityLogFactory
    {
        return ActivityLogFactory::new();
    }
}
