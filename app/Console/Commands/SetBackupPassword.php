<?php

namespace App\Console\Commands;

use App\Support\BackupArchivePassword;
use Illuminate\Console\Command;

class SetBackupPassword extends Command
{
    protected $signature = 'backup:password';

    protected $description = 'Configura una contraseña independiente para los próximos respaldos';

    public function handle(BackupArchivePassword $backupPassword): int
    {
        $password = $this->secret('Nueva contraseña (mínimo 16 caracteres)');

        if (! is_string($password) || mb_strlen($password) < 16 || mb_strlen($password) > 1024) {
            $this->components->error('La contraseña debe tener entre 16 y 1024 caracteres.');

            return self::FAILURE;
        }

        if ($this->secret('Repite la contraseña') !== $password) {
            $this->components->error('Las contraseñas no coinciden.');

            return self::FAILURE;
        }

        $backupPassword->store($password);

        $this->components->info('Contraseña cifrada y guardada para los próximos respaldos.');
        $this->components->warn('Conserva la contraseña fuera del servidor. Los ZIP anteriores mantienen su contraseña original.');

        return self::SUCCESS;
    }
}
