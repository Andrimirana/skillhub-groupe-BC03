<?php

use App\Http\Controllers\EnrollmentController;
use Illuminate\Support\Facades\Route;

// Routes publiques — avis laissés par les apprenants
Route::get('/avis',                          [EnrollmentController::class, 'avisRecents']);
Route::get('/formations/{formationId}/avis', [EnrollmentController::class, 'avisFormation']);

// Routes privées — inscription requiert un token valide
Route::middleware('auth.service')->group(function (): void {
    Route::post('/formations/{formationId}/inscription',    [EnrollmentController::class, 'store']);
    Route::delete('/formations/{formationId}/inscription',  [EnrollmentController::class, 'destroy']);
    Route::put('/formations/{formationId}/progression',     [EnrollmentController::class, 'updateProgress']);
    Route::get('/apprenant/formations',                     [EnrollmentController::class, 'myCourses']);
    Route::put('/formations/{formationId}/avis',            [EnrollmentController::class, 'donnerAvis']);
    Route::get('/formateur/statistiques',                   [EnrollmentController::class, 'statistiquesFormateur']);
});
