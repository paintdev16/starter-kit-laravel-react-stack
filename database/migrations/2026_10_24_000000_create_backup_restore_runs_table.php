<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_restore_runs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk');
            $table->string('archive');
            $table->string('status', 20)->default('pending');
            $table->text('error')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_restore_runs');
    }
};
