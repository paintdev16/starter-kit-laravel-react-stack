<?php

namespace App\Jobs;

use App\Support\BackupArchivePassword;
use App\Support\BackupProblemNotifier;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PrepareBackupRestore implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public int $timeout = 3600;

    public int $tries = 1;

    public function __construct(
        public readonly string $runId,
        public readonly string $disk,
        public readonly string $archive,
        private readonly ?string $password = null,
    ) {
        $this->onConnection('backup_restores')->onQueue('backup-restores');
    }

    public function handle(BackupArchivePassword $backupPassword, BackupProblemNotifier $notifier): void
    {
        $automatic = DB::table('backup_restore_runs')->where('id', $this->runId)->whereNull('requested_by')->exists();
        DB::table('backup_restore_runs')->where('id', $this->runId)->update(['status' => 'running', 'updated_at' => now()]);
        $target = storage_path('app/restore-staging/'.$this->runId);

        try {
            $backupPassword->apply();
            $parent = storage_path('app/restore-staging');
            File::ensureDirectoryExists($parent, 0700);

            $configuredPassword = config('backup.backup.password');

            if ($this->password !== null && $this->password !== '') {
                config(['backup.backup.password' => $this->password]);
            }

            try {
                $exitCode = Artisan::call('backup:restore', [
                    'archive' => $this->archive,
                    '--disk' => $this->disk,
                    '--target' => $parent.DIRECTORY_SEPARATOR.$this->runId,
                    '--no-interaction' => true,
                ]);
            } finally {
                config(['backup.backup.password' => $configuredPassword]);
            }

            if ($exitCode !== 0) {
                throw new RuntimeException('El ZIP no pudo restaurarse. Comprueba la contraseña configurada y el registro del servidor.');
            }

            if ($automatic && ! $this->cleanAutomaticTarget($target)) {
                throw new RuntimeException('El simulacro se restauró, pero no se pudo limpiar la copia aislada.');
            }

            DB::table('backup_restore_runs')->where('id', $this->runId)->update([
                'status' => 'completed',
                'finished_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::error('Falló la preparación de un respaldo', [
                'run_id' => $this->runId,
                'exception' => $exception,
            ]);

            DB::table('backup_restore_runs')->where('id', $this->runId)->update([
                'status' => 'failed',
                'error' => $automatic
                    ? 'El simulacro no pudo restaurar o limpiar el ZIP. Comprueba la contraseña, el espacio disponible y los registros.'
                    : 'No se pudo restaurar el ZIP. Comprueba la contraseña y los registros del servidor.',
                'finished_at' => now(),
                'updated_at' => now(),
            ]);

            if ($automatic) {
                if (! $this->cleanAutomaticTarget($target)) {
                    Log::warning('No se pudo eliminar la copia parcial del simulacro.', ['run_id' => $this->runId]);
                }

                $notifier->send('Falló el simulacro de restauración', 'El respaldo '.$this->archive.' no pudo recuperarse en una carpeta aislada. Revisa la contraseña, el espacio disponible y los registros.', route('advanced.settings.index'));
            }
        }
    }

    public function failed(?Throwable $exception): void
    {
        DB::table('backup_restore_runs')->where('id', $this->runId)->update([
            'status' => 'failed',
            'error' => 'El proceso de restauración se interrumpió. Revisa el worker y los registros.',
            'finished_at' => now(),
            'updated_at' => now(),
        ]);

        if ($exception !== null) {
            Log::error('El worker interrumpió una restauración', ['run_id' => $this->runId, 'exception' => $exception]);
        }

        if (DB::table('backup_restore_runs')->where('id', $this->runId)->whereNull('requested_by')->exists()) {
            if (! $this->cleanAutomaticTarget(storage_path('app/restore-staging/'.$this->runId))) {
                Log::warning('No se pudo eliminar la copia parcial del simulacro.', ['run_id' => $this->runId]);
            }

            app(BackupProblemNotifier::class)->send('Simulacro de restauración interrumpido', 'El worker no terminó la verificación del respaldo '.$this->archive.'. Revisa la cola y los registros.', route('advanced.settings.index'));
        }
    }

    private function cleanAutomaticTarget(string $target): bool
    {
        if (! File::isDirectory($target)) {
            return true;
        }

        File::deleteDirectory($target);
        clearstatcache(true, $target);

        if (File::isDirectory($target)) {
            $directories = File::allDirectories($target);
            usort($directories, fn (string $left, string $right): int => strlen($right) <=> strlen($left));

            foreach ($directories as $directory) {
                @rmdir($directory);
            }

            unset($directories, $directory);
            @rmdir($target);
        }

        clearstatcache(true, $target);

        return ! File::exists($target);
    }
}
