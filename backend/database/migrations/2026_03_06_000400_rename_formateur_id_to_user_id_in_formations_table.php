<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            if (! Schema::hasColumn('formations', 'formateur_id')) {
                return;
            }

            $table->dropForeign(['formateur_id']);
            $table->renameColumn('formateur_id', 'user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table): void {
            if (! Schema::hasColumn('formations', 'user_id')) {
                return;
            }

            $table->dropForeign(['user_id']);
            $table->renameColumn('user_id', 'formateur_id');
            $table->foreign('formateur_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
