<?php

namespace App\Actions\Advanced;

use App\Jobs\HealthQueueProbe;
use App\Support\ApplicationFeatures;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Backup\BackupDestination\BackupDestination;
use Throwable;

class GetSystemHealth
{
    public function __construct(private ApplicationFeatures $features) {}

    public function handle(): array
    {
        $database = $this->check(function (): void {
            DB::select('SELECT 1');
        }, 'La base de datos respondió correctamente.', 'No se pudo consultar la base de datos.');

        $cache = $this->check(function (): void {
            $key = 'health:cache:'.Str::random(24);
            $value = Str::random(24);

            try {
                if (! Cache::put($key, $value, 30) || Cache::get($key) !== $value) {
                    throw new \RuntimeException('La caché no conservó el valor de prueba.');
                }
            } finally {
                Cache::forget($key);
            }
        }, 'Lectura y escritura correctas.', 'La caché no completó la prueba de lectura y escritura.');

        $storage = $this->check(function (): void {
            $disk = Storage::disk();
            $path = 'health-checks/'.Str::random(32).'.txt';
            $value = Str::random(24);

            try {
                if (! $disk->put($path, $value) || $disk->get($path) !== $value) {
                    throw new \RuntimeException('El disco no conservó el archivo de prueba.');
                }
            } finally {
                $disk->delete($path);
            }
        }, 'Lectura y escritura correctas en el disco predeterminado.', 'El disco predeterminado no completó la prueba de lectura y escritura.');

        return [
            'checked_at' => now()->toIso8601String(),
            'database' => $database,
            'cache' => $cache,
            'storage' => [
                ...$storage,
                'driver' => (string) config('filesystems.default'),
            ],
            'queue' => $this->queue($cache['status'] === 'healthy'),
            'backup' => $this->backup(),
            'reverb' => [
                'enabled' => $this->features->reverbEnabled(),
                'configured' => config('broadcasting.default') === 'reverb'
                    && filled(config('broadcasting.connections.reverb.key'))
                    && filled(config('broadcasting.connections.reverb.app_id'))
                    && filled(config('broadcasting.connections.reverb.options.host')),
            ],
        ];
    }

    private function check(callable $probe, string $success, string $failure): array
    {
        try {
            $probe();

            return ['status' => 'healthy', 'message' => $success];
        } catch (Throwable) {
            return ['status' => 'unhealthy', 'message' => $failure];
        }
    }

    private function queue(bool $cacheHealthy): array
    {
        $connection = (string) config('queue.default');
        $driver = (string) config("queue.connections.{$connection}.driver", $connection);

        if (in_array($driver, ['sync', 'deferred', 'background'], true)) {
            return ['status' => 'informational', 'message' => 'Esta conexión procesa tareas sin un worker persistente.', 'driver' => $connection];
        }

        if (in_array($driver, ['null', 'failover'], true) || ! $cacheHealthy || in_array(config('cache.default'), ['array', 'null'], true)) {
            return ['status' => 'unknown', 'message' => 'No se puede comprobar el procesamiento con esta configuración de cola y caché.', 'driver' => $connection];
        }

        try {
            $probe = Cache::get('health:queue-probe');
            $queuedAt = is_array($probe) ? strtotime((string) ($probe['queued_at'] ?? '')) : false;

            if ($queuedAt === false || $queuedAt < time() - 60) {
                $probe = [
                    'id' => (string) Str::uuid(),
                    'queued_at' => now()->toIso8601String(),
                    'completed_at' => null,
                ];
                Cache::put('health:queue-probe', $probe, now()->addMinutes(5));
                HealthQueueProbe::dispatch($probe['id'])->onConnection($connection);
                $probe = Cache::get('health:queue-probe');
                $queuedAt = time();
            }

            if (is_array($probe) && filled($probe['completed_at'] ?? null)) {
                return ['status' => 'healthy', 'message' => 'La tarea de prueba fue procesada por la cola.', 'driver' => $connection, 'last_processed_at' => $probe['completed_at']];
            }

            if ($queuedAt !== false && $queuedAt < time() - 20) {
                return ['status' => 'unhealthy', 'message' => 'La tarea de prueba no se procesó en 20 segundos. Revisa el worker.', 'driver' => $connection];
            }

            return ['status' => 'pending', 'message' => 'Esperando que el worker procese la tarea de prueba.', 'driver' => $connection];
        } catch (Throwable) {
            return ['status' => 'unhealthy', 'message' => 'No se pudo enviar o consultar la tarea de prueba.', 'driver' => $connection];
        }
    }

    private function backup(): array
    {
        $disk = (string) config('backup.backup.destination.disks.0', 'backups');
        $name = (string) config('backup.backup.name', 'application');
        $location = config("filesystems.disks.{$disk}.driver") === 'local' ? 'local' : 'remoto';

        if (! $this->features->backupsEnabled()) {
            return ['status' => 'inactive', 'message' => 'Los respaldos automáticos están desactivados.', 'disk' => $disk, 'location' => $location];
        }

        try {
            if (blank(config('backup.backup.password'))) {
                return ['status' => 'unhealthy', 'message' => 'Falta la clave de cifrado de respaldos.', 'disk' => $disk, 'location' => $location];
            }

            $destination = BackupDestination::create($disk, $name);

            if (! $destination->isReachable()) {
                return ['status' => 'unhealthy', 'message' => 'No se puede acceder al disco de respaldos.', 'disk' => $disk, 'location' => $location];
            }

            $latest = $destination->newestBackup();

            if ($latest === null) {
                return ['status' => 'unhealthy', 'message' => 'Todavía no existe ningún respaldo.', 'disk' => $disk, 'location' => $location];
            }

            return [
                'status' => $latest->date()->lt(now()->subDays(2)) ? 'unhealthy' : 'healthy',
                'message' => $latest->date()->lt(now()->subDays(2))
                    ? 'El respaldo más reciente tiene más de dos días.'
                    : 'Hay un respaldo reciente disponible.',
                'disk' => $disk,
                'location' => $location,
                'last_backup_at' => $latest->date()->toIso8601String(),
            ];
        } catch (Throwable) {
            return ['status' => 'unhealthy', 'message' => 'No se pudo consultar el estado de los respaldos.', 'disk' => $disk, 'location' => $location];
        }
    }
}
