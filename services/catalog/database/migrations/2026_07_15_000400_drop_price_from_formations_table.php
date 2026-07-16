<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            if (Schema::hasColumn('formations', 'price')) {
                $table->dropColumn('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            if (!Schema::hasColumn('formations', 'price')) {
                $table->decimal('price', 10, 2)->default(0)->after('statut');
            }
        });
    }
};
