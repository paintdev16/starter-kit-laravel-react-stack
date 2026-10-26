<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RuntimeException;
use Spatie\Backup\BackupDestination\BackupDestination;
use Symfony\Component\Process\Process;
use Throwable;
use ZipArchive;

class RestoreBackup extends Command
{
    protected $signature = 'backup:restore
        {archive? : Nombre del ZIP en el disco; por defecto, el más reciente}
        {--disk= : Disco de respaldo configurado}
        {--target= : Carpeta nueva y absoluta donde preparar la restauración}
        {--ask-password : Solicitar la contraseña del ZIP en lugar de usar la configuración actual}';

    protected $description = 'Descifra y restaura un respaldo en una carpeta aislada';

    public function handle(): int
    {
        $diskName = (string) ($this->option('disk') ?: config('backup.backup.destination.disks.0'));
        $allowedDisks = config('backup.backup.destination.disks', []);
        $target = (string) $this->option('target');

        if (! in_array($diskName, $allowedDisks, true)) {
            $this->components->error('El disco indicado no está configurado como destino de respaldo.');

            return self::FAILURE;
        }

        if (! preg_match('/\A(?:[A-Za-z]:[\\\\\/]|[\\\\\/]{2}|\/)/', $target) || file_exists($target) || is_link($target)) {
            $this->components->error('--target debe ser una ruta absoluta que todavía no exista.');

            return self::FAILURE;
        }

        $parent = realpath(dirname($target));

        if ($parent === false || ! is_dir($parent) || ! is_writable($parent)) {
            $this->components->error('La carpeta principal de --target debe existir y permitir escritura.');

            return self::FAILURE;
        }

        $target = $parent.DIRECTORY_SEPARATOR.basename(rtrim($target, '\\/'));

        $destination = BackupDestination::create($diskName, (string) config('backup.backup.name'));

        if (! $destination->isReachable()) {
            $this->components->error('No se puede acceder al disco de respaldos.');

            return self::FAILURE;
        }

        $archive = $this->argument('archive');

        if ($archive === null) {
            $archive = $destination->newestBackup()?->path();
        } elseif (is_string($archive) && preg_match('/\A[A-Za-z0-9_.-]+\.zip\z/iD', $archive)) {
            $archive = $destination->backupName().'/'.$archive;
        } else {
            $this->components->error('Indica únicamente el nombre del archivo ZIP, sin rutas.');

            return self::FAILURE;
        }

        if (! is_string($archive) || ! $destination->disk()->exists($archive)) {
            $this->components->error('No se encontró el respaldo en el disco configurado.');

            return self::FAILURE;
        }

        $password = $this->option('ask-password')
            ? $this->secret('Contraseña del ZIP')
            : config('backup.backup.password');

        if (! is_string($password) || $password === '') {
            $this->components->error('Falta la contraseña. Usa --ask-password o configura BACKUP_ARCHIVE_PASSWORD.');

            return self::FAILURE;
        }

        $temporaryArchive = tempnam(sys_get_temp_dir(), 'backup-restore-');

        if ($temporaryArchive === false) {
            $this->components->error('No se pudo crear un archivo temporal.');

            return self::FAILURE;
        }

        try {
            $source = $destination->disk()->readStream($archive);
            $copy = fopen($temporaryArchive, 'wb');

            if (! is_resource($source) || ! is_resource($copy)) {
                throw new RuntimeException('No se pudo descargar el respaldo.');
            }

            try {
                if (stream_copy_to_stream($source, $copy) === false) {
                    throw new RuntimeException('La descarga del respaldo quedó incompleta.');
                }
            } finally {
                fclose($source);
                fclose($copy);
            }

            if (! mkdir($target, 0700)) {
                throw new RuntimeException('No se pudo crear la carpeta de restauración.');
            }

            $this->extract($temporaryArchive, $target, $password);
            $this->restoreSqlite($target);

            $this->components->info('Respaldo restaurado en: '.$target);
            $this->line('El volcado original está en db-dumps/. Los archivos están en storage/app/.');
            $this->components->warn('Comprueba esta copia aislada antes de usarla. La base y los archivos activos no se modificaron.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->components->error('Restauración cancelada: '.$exception->getMessage());

            if (is_dir($target)) {
                $this->components->warn('La copia parcial permanece en: '.$target);
            }

            return self::FAILURE;
        } finally {
            @unlink($temporaryArchive);
        }
    }

    private function extract(string $archive, string $target, string $password): void
    {
        $zip = new ZipArchive;

        if ($zip->open($archive, ZipArchive::RDONLY) !== true) {
            throw new RuntimeException('El archivo no es un ZIP válido.');
        }

        try {
            $zip->setPassword($password);
            $seen = [];
            $totalSize = 0;
            $hasDump = false;

            if ($zip->numFiles < 1 || $zip->numFiles > 100000) {
                throw new RuntimeException('El ZIP está vacío o contiene demasiadas entradas.');
            }

            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);
                $name = isset($stat['name']) ? str_replace('\\', '/', $stat['name']) : null;

                if (! is_string($name) || ! $this->safeEntry($name)) {
                    throw new RuntimeException('El ZIP contiene una ruta no permitida: '.json_encode($name, JSON_INVALID_UTF8_SUBSTITUTE));
                }

                $canonical = strtolower(rtrim($name, '/'));

                if (isset($seen[$canonical])) {
                    throw new RuntimeException('El ZIP contiene rutas duplicadas.');
                }

                $seen[$canonical] = true;
                $totalSize += (int) ($stat['size'] ?? 0);

                if ($totalSize > 50 * 1024 * 1024 * 1024) {
                    throw new RuntimeException('El ZIP excede el límite de 50 GB descomprimidos.');
                }

                $zip->getExternalAttributesIndex($index, $operatingSystem, $attributes);

                if ($operatingSystem === ZipArchive::OPSYS_UNIX && (($attributes >> 16) & 0170000) === 0120000) {
                    throw new RuntimeException('El ZIP contiene un enlace simbólico.');
                }

                if (str_ends_with($name, '.sql') && str_starts_with($name, 'db-dumps/')) {
                    $hasDump = true;
                }
            }

            if (! $hasDump) {
                throw new RuntimeException('El ZIP no contiene un volcado SQL.');
            }

            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);
                $name = str_replace('\\', '/', $stat['name']);
                $path = $target.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $name);

                if (str_ends_with($name, '/')) {
                    if (! is_dir($path) && ! mkdir($path, 0700, true)) {
                        throw new RuntimeException('No se pudo crear una carpeta restaurada.');
                    }

                    continue;
                }

                $directory = dirname($path);

                if (! is_dir($directory) && ! mkdir($directory, 0700, true)) {
                    throw new RuntimeException('No se pudo crear una carpeta restaurada.');
                }

                $input = $zip->getStreamIndex($index);
                $output = fopen($path, 'wb');

                if (! is_resource($input) || ! is_resource($output)) {
                    throw new RuntimeException('No se pudo descifrar una entrada. Revisa la contraseña y el archivo.');
                }

                try {
                    $written = stream_copy_to_stream($input, $output, (int) $stat['size'] + 1);

                    if ($written === false || $written !== (int) $stat['size']) {
                        throw new RuntimeException('Una entrada está incompleta o dañada.');
                    }
                } finally {
                    fclose($input);
                    fclose($output);
                }
            }
        } finally {
            $zip->close();
        }
    }

    private function safeEntry(string $name): bool
    {
        if (str_contains($name, ':') || str_contains($name, "\0")
            || str_contains($name, '//') || preg_match('/[\x00-\x1F]/', $name)
            || str_starts_with($name, '/') || preg_match('~(^|/)\.{1,2}(/|$)~', $name)) {
            return false;
        }

        return $name === 'db-dumps/'
            || $name === 'storage/'
            || $name === 'storage/app/'
            || $name === 'storage/app/private/'
            || $name === 'storage/app/public/'
            || str_starts_with($name, 'db-dumps/')
            || str_starts_with($name, 'storage/app/private/')
            || str_starts_with($name, 'storage/app/public/');
    }

    private function restoreSqlite(string $target): void
    {
        $dumps = glob($target.DIRECTORY_SEPARATOR.'db-dumps'.DIRECTORY_SEPARATOR.'sqlite-*.sql') ?: [];

        if ($dumps === []) {
            $this->components->warn('El volcado no es SQLite. Impórtalo en una base nueva con el cliente de su motor.');

            return;
        }

        if (count($dumps) !== 1) {
            throw new RuntimeException('Se esperaba un solo volcado SQLite.');
        }

        $databaseDirectory = $target.DIRECTORY_SEPARATOR.'database';

        if (! mkdir($databaseDirectory, 0700)) {
            throw new RuntimeException('No se pudo crear la carpeta para la base restaurada.');
        }

        $database = $databaseDirectory.DIRECTORY_SEPARATOR.'restored.sqlite';
        $input = fopen($dumps[0], 'rb');

        if (! is_resource($input)) {
            throw new RuntimeException('No se pudo leer el volcado SQLite.');
        }

        try {
            $process = new Process(['sqlite3', '-bail', $database]);
            $process->setInput($input);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new RuntimeException('SQLite no pudo importar el volcado: '.trim($process->getErrorOutput()));
            }
        } finally {
            fclose($input);
        }

        $check = new Process(['sqlite3', $database, 'PRAGMA integrity_check;']);
        $check->run();

        if (! $check->isSuccessful() || trim($check->getOutput()) !== 'ok') {
            throw new RuntimeException('La base SQLite restaurada no superó integrity_check.');
        }

        $this->line('Base SQLite verificada en database/restored.sqlite.');
    }
}
