<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            $table->string('category', 100)->default('Développement web')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            $table->dropColumn('category');
        });
    }
};
