<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/inscription', [AuthController::class, 'inscription']);
Route::post('/register',    [AuthController::class, 'inscription']);
Route::post('/connexion',   [AuthController::class, 'connexion']);
Route::post('/login',       [AuthController::class, 'connexion']);

// Endpoint interne — appelé par les autres services pour valider un token
Route::post('/validate-token', [AuthController::class, 'validateToken']);

// Routes privées
Route::middleware('jwt')->group(function (): void {
    Route::get('/profil',       [AuthController::class, 'profil']);
    Route::get('/profile',      [AuthController::class, 'profil']);
    Route::post('/deconnexion', [AuthController::class, 'deconnexion']);
    Route::post('/logout',      [AuthController::class, 'deconnexion']);
});
