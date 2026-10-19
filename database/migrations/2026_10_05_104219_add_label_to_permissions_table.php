<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('label')->default('')->after('name');
        });

        DB::table('permissions')
            ->where('label', '')
            ->get(['id', 'name'])
            ->each(function (object $permission): void {
                DB::table('permissions')
                    ->where('id', $permission->id)
                    ->update([
                        'label' => Str::headline(str_replace(['.', '-'], ' ', $permission->name)),
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn('label');
        });
    }
};
