<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            $table->decimal('price', 10, 2)->default(0)->after('statut');
            $table->unsignedInteger('duration')->default(1)->after('price');
            $table->enum('level', ['beginner', 'intermediaire', 'advanced'])->default('beginner')->after('duration');
        });
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            $table->dropColumn(['price', 'duration', 'level']);
        });
    }
};
