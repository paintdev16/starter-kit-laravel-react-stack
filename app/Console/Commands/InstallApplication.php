<?php

namespace App\Console\Commands;

use App\Support\ApplicationInstallation;
use Illuminate\Console\Command;
use RuntimeException;

class InstallApplication extends Command
{
    protected $signature = 'app:install';

    protected $description = 'Habilita el asistente para crear el primer super-admin en una base sin usuarios';

    public function handle(ApplicationInstallation $installation): int
    {
        try {
            $token = $installation->prepare();
        } catch (RuntimeException $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->components->info('Instalación inicial habilitada durante 60 minutos.');
        $this->line('Abre: '.route('setup.show'));
        $this->line('Código de instalación: '.$token);
        $this->components->warn('Guarda este código en privado. Al repetir el comando, el código anterior deja de funcionar.');

        return self::SUCCESS;
    }
}
