<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        $disk = Storage::disk('local');

        if ($disk->directoryExists('managed-files') && ! $disk->deleteDirectory('managed-files')) {
            throw new RuntimeException('No se pudieron eliminar los archivos administrados.');
        }

        DB::table('audit_logs')->whereIn('event', ['file_uploaded', 'file_deleted'])->delete();
        Schema::dropIfExists('managed_files');
    }

    public function down(): void
    {
        // Recreates the schema only; deleted documents and records cannot be restored.
        Schema::create('managed_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('disk')->default('private');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 150);
            $table->unsignedBigInteger('size');
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }
};
