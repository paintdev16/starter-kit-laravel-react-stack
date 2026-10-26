<?php

namespace App\Console\Commands;

use App\Jobs\PrepareBackupRestore;
use App\Support\ApplicationFeatures;
use App\Support\BackupProblemNotifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Backup\BackupDestination\BackupDestination;
use Throwable;

class VerifyBackup extends Command
{
    protected $signature = 'backup:verify';

    protected $description = 'Programa una restauración aislada del respaldo más reciente cada siete días';

    public function handle(ApplicationFeatures $features, BackupProblemNotifier $notifier): int
    {
        if (! $features->backupsEnabled()) {
            $this->components->info('Los respaldos automáticos están pausados.');

            return self::SUCCESS;
        }

        $alertUrl = route('advanced.settings.index');

        try {
            $stale = DB::table('backup_restore_runs')
                ->whereIn('status', ['pending', 'running'])
                ->where('created_at', '<', now()->subHours(4))
                ->update([
                    'status' => 'failed',
                    'error' => 'La tarea no terminó en el plazo previsto. Revisa el worker de respaldos.',
                    'finished_at' => now(),
                    'updated_at' => now(),
                ]);

            if ($stale > 0) {
                $notifier->send('Restauración de respaldo interrumpida', 'Una restauración quedó pendiente o en proceso durante más de cuatro horas. Revisa el worker y los registros.', $alertUrl);
            }

            if (DB::table('backup_restore_runs')->whereIn('status', ['pending', 'running'])->exists()) {
                $this->components->info('Ya hay una restauración en curso.');

                return self::SUCCESS;
            }

            if (DB::table('backup_restore_runs')
                ->whereNull('requested_by')
                ->where('status', 'completed')
                ->where('finished_at', '>=', now()->subDays(7))
                ->exists()) {
                $this->components->info('Ya se verificó un respaldo en los últimos siete días.');

                return self::SUCCESS;
            }

            $disk = (string) config('backup.backup.destination.disks.0');
            $destination = BackupDestination::create($disk, (string) config('backup.backup.name'));
            $latest = $destination->isReachable() ? $destination->newestBackup() : null;
            $archive = $latest ? basename($latest->path()) : 'Ninguno';
            $id = (string) Str::uuid();

            DB::table('backup_restore_runs')->insert([
                'id' => $id,
                'disk' => $disk,
                'archive' => $archive,
                'status' => $latest ? 'pending' : 'failed',
                'error' => $latest ? null : 'No hay un respaldo disponible para verificar.',
                'finished_at' => $latest ? null : now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($latest === null) {
                $notifier->send('No se pudo verificar el respaldo', 'No hay un ZIP disponible en el disco configurado para el simulacro de restauración.', $alertUrl);
                $this->components->error('No hay un respaldo disponible.');

                return self::FAILURE;
            }

            try {
                PrepareBackupRestore::dispatch($id, $disk, $archive);
            } catch (Throwable $exception) {
                DB::table('backup_restore_runs')->where('id', $id)->update([
                    'status' => 'failed',
                    'error' => 'No se pudo enviar el simulacro a la cola.',
                    'finished_at' => now(),
                    'updated_at' => now(),
                ]);

                throw $exception;
            }

            $this->components->info('Simulacro enviado a la cola: '.$archive);

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $notifier->send('Falló la verificación del respaldo', 'No se pudo iniciar el simulacro de restauración. Revisa el disco, la cola y los registros del servidor.', $alertUrl);
            $this->components->error('No se pudo iniciar la verificación.');

            return self::FAILURE;
        }
    }
}
