<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

test('restoration rejects ZIP paths that escape the recovery directory', function () {
    Storage::fake('backups');
    Storage::disk('backups')->makeDirectory('application');
    config([
        'backup.backup.destination.disks' => ['backups'],
        'backup.backup.name' => 'application',
        'backup.backup.password' => 'fixture-password',
    ]);

    $zip = new ZipArchive;
    $zip->open(Storage::disk('backups')->path('application/malicious.zip'), ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('db-dumps/sqlite-sqlite-database.sql', 'SELECT 1;');
    $zip->addFromString('storage/app/private/../../escape.txt', 'escaped');
    $zip->close();

    $id = (string) Str::uuid();
    $target = storage_path('app/restore-staging/'.$id);
    File::ensureDirectoryExists(dirname($target));
    $escaped = storage_path('app/restore-staging/escape.txt');

    try {
        $exitCode = Artisan::call('backup:restore', [
            'archive' => 'malicious.zip',
            '--disk' => 'backups',
            '--target' => $target,
            '--no-interaction' => true,
        ]);

        expect($exitCode)->toBe(1);
        expect(File::exists($escaped))->toBeFalse();
    } finally {
        File::deleteDirectory($target);
    }
});
