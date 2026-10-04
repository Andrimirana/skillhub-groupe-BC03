<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table): void {
            if (!Schema::hasColumn('enrollments', 'utilisateur_nom')) {
                $table->string('utilisateur_nom')->nullable()->after('utilisateur_id');
            }
            if (!Schema::hasColumn('enrollments', 'avis_note')) {
                $table->unsignedTinyInteger('avis_note')->nullable()->after('last_lesson_key');
            }
            if (!Schema::hasColumn('enrollments', 'avis_commentaire')) {
                $table->text('avis_commentaire')->nullable()->after('avis_note');
            }
            if (!Schema::hasColumn('enrollments', 'avis_date')) {
                $table->timestamp('avis_date')->nullable()->after('avis_commentaire');
            }
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table): void {
            foreach (['utilisateur_nom', 'avis_note', 'avis_commentaire', 'avis_date'] as $colonne) {
                if (Schema::hasColumn('enrollments', $colonne)) {
                    $table->dropColumn($colonne);
                }
            }
        });
    }
};
