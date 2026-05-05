<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'Catalog API',
        'status' => 'running'
    ]);
});
