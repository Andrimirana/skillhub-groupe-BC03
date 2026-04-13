<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\ModuleController;
use Illuminate\Support\Facades\Route;

// Routes publiques d'authentification
Route::post('/connexion', [AuthController::class, 'connexion']);
Route::post('/inscription', [AuthController::class, 'inscription']);
Route::post('/register', [AuthController::class, 'inscription']);
Route::post('/login', [AuthController::class, 'connexion']);
Route::get('/formations', [FormationController::class, 'index']);
Route::get('/formations/{formation}', [FormationController::class, 'show']);
Route::get('/formations/{formation}/modules', [ModuleController::class, 'index']);

// Routes privées protégées par le middleware JWT
Route::middleware('jwt')->group(function (): void {
    Route::get('/profil', [AuthController::class, 'profil']);
    Route::get('/profile', [AuthController::class, 'profil']);
    Route::post('/deconnexion', [AuthController::class, 'deconnexion']);
    Route::post('/logout', [AuthController::class, 'deconnexion']);
    Route::get('/my-formations', [FormationController::class, 'myFormations']);
    Route::post('/formations', [FormationController::class, 'store']);
    Route::put('/formations/{formation}', [FormationController::class, 'update']);
    Route::delete('/formations/{formation}', [FormationController::class, 'destroy']);
    Route::post('/formations/{formation}/modules', [ModuleController::class, 'store']);
    Route::put('/modules/{module}', [ModuleController::class, 'update']);
    Route::delete('/modules/{module}', [ModuleController::class, 'destroy']);
    Route::post('/formations/{formation}/inscription', [EnrollmentController::class, 'store']);
    Route::delete('/formations/{formation}/inscription', [EnrollmentController::class, 'destroy']);
    Route::get('/apprenant/formations', [EnrollmentController::class, 'myCourses']);
});
