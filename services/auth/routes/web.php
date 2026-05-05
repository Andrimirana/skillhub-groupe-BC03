<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'Auth API',
        'status' => 'running',
        'version' => '1.0.0',
        'endpoints' => [
            'POST /api/register' => 'Inscription',
            'POST /api/login' => 'Connexion',
        ]
    ]);
});
