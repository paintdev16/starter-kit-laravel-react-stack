<?php

namespace App\Listeners;

use App\Support\BackupProblemNotifier;
use Spatie\Backup\Events\BackupHasFailed;
use Spatie\Backup\Events\CleanupHasFailed;
use Spatie\Backup\Events\UnhealthyBackupWasFound;

class NotifySuperAdminsOfBackupProblem
{
    public function __construct(private readonly BackupProblemNotifier $notifier) {}

    public function handle(BackupHasFailed|CleanupHasFailed|UnhealthyBackupWasFound $event): void
    {
        [$title, $message] = match (true) {
            $event instanceof BackupHasFailed => [
                'Falló el respaldo',
                'No se pudo crear el respaldo programado. El último respaldo disponible podría estar desactualizado.',
            ],
            $event instanceof CleanupHasFailed => [
                'Falló la limpieza de respaldos',
                'No se pudo aplicar la política de retención a los respaldos antiguos.',
            ],
            default => [
                'Respaldo desactualizado o inaccesible',
                'El monitor encontró un problema con los respaldos. Comprueba su antigüedad y el disco de destino.',
            ],
        };

        $this->notifier->send($title, $message);
    }
}
