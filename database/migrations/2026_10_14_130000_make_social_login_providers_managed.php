<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_login_providers', function (Blueprint $table): void {
            $table->string('client_id')->nullable();
            $table->text('client_secret')->nullable();
        });

        DB::table('social_login_providers')->whereIn('provider', ['github', 'google'])->delete();
    }

    public function down(): void
    {
        foreach (['github', 'google'] as $provider) {
            DB::table('social_login_providers')->updateOrInsert(
                ['provider' => $provider],
                ['enabled' => false, 'created_at' => now(), 'updated_at' => now()],
            );
        }

        Schema::table('social_login_providers', function (Blueprint $table): void {
            $table->dropColumn(['client_id', 'client_secret']);
        });
    }
};
