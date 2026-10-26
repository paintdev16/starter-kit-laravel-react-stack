<?php

namespace App\Actions\Advanced;

use App\Support\ApplicationFeatures;
use Illuminate\Support\Facades\DB;
use Spatie\Backup\BackupDestination\BackupDestination;
use Throwable;

class GetBackupSettings
{
    public function __construct(private readonly ApplicationFeatures $features) {}

    public function handle(): array
    {
        $disk = (string) config('backup.backup.destination.disks.0');
        $destination = BackupDestination::create($disk, (string) config('backup.backup.name'));
        $available = false;
        $backups = [];

        try {
            $available = $destination->isReachable();

            if ($available) {
                $backups = $destination->backups()->take(10)->map(fn ($backup): array => [
                    'name' => basename($backup->path()),
                    'created_at' => $backup->date()->toIso8601String(),
                    'size_bytes' => (int) $backup->sizeInBytes(),
                ])->values()->all();
            }
        } catch (Throwable) {
            $available = false;
        }

        return [
            'enabled' => $this->features->backupsEnabled(),
            'disk' => $disk,
            'available' => $available,
            'password_type' => config('backup.backup.password') === config('app.key') ? 'app_key' : 'dedicated',
            'backups' => $backups,
            'restores' => DB::table('backup_restore_runs')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'requested_by', 'archive', 'status', 'error', 'created_at', 'finished_at'])
                ->map(fn ($run): array => [
                    'id' => $run->id,
                    'automatic' => $run->requested_by === null,
                    'archive' => $run->archive,
                    'status' => $run->status,
                    'error' => $run->error,
                    'created_at' => $run->created_at,
                    'finished_at' => $run->finished_at,
                    'path' => $run->status === 'completed' && $run->requested_by !== null ? storage_path('app/restore-staging/'.$run->id) : null,
                ])->all(),
        ];
    }
}
