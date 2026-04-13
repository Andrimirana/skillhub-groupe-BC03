<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        env('FRONTEND_URL_ALT', 'http://127.0.0.1:5173'),
        env('FRONTEND_URL_DEV', 'http://localhost:5174'),
        env('FRONTEND_URL_DEV_ALT', 'http://127.0.0.1:5174'),
        env('FRONTEND_URL_DEV2', 'http://localhost:5175'),
        env('FRONTEND_URL_DEV2_ALT', 'http://127.0.0.1:5175'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
