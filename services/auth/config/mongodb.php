<?php

return [

    /*
    |--------------------------------------------------------------------------
    | MongoDB Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour la connexion à MongoDB et le logging d'activités
    |
    */

    'default' => env('MONGO_DRIVER', 'mongodb'),

    'connections' => [
        'mongodb' => [
            'driver' => 'mongodb',
            'host' => env('MONGO_HOST', 'localhost'),
            'port' => env('MONGO_PORT', 27017),
            'database' => env('MONGO_DATABASE', 'skillhub_logs'),
            'username' => env('MONGO_USERNAME'),
            'password' => env('MONGO_PASSWORD'),
            'options' => [
                'replicaSet' => env('MONGO_REPLICA_SET'),
                'authMechanism' => 'SCRAM-SHA-1',
                'authSource' => 'admin',
            ]
        ],
    ],

    // Collections et indices
    'collections' => [
        'activity_logs' => 'activity_logs',
        'sessions' => 'sessions',
        'analytics' => 'analytics',
        'certificates' => 'certificates',
        'user_progress' => 'user_progress',
    ],

    // Configuration du logging
    'logging' => [
        'enabled' => env('MONGO_LOGGING_ENABLED', true),
        'retention_days' => env('MONGO_LOG_RETENTION_DAYS', 90),
        'include_user_agent' => true,
        'include_ip_address' => true,
    ],

    // Configuration des analytics
    'analytics' => [
        'enabled' => env('MONGO_ANALYTICS_ENABLED', true),
        'auto_aggregate' => env('MONGO_AUTO_AGGREGATE', true),
        'aggregation_interval' => env('MONGO_AGGREGATION_INTERVAL', 'daily'), // hourly, daily, weekly
    ],

];
