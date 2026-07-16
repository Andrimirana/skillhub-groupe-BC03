<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table): void {
            if (!Schema::hasColumn('enrollments', 'last_lesson_key')) {
                $table->string('last_lesson_key')->nullable()->after('completed_modules');
            }
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table): void {
            if (Schema::hasColumn('enrollments', 'last_lesson_key')) {
                $table->dropColumn('last_lesson_key');
            }
        });
    }
};
