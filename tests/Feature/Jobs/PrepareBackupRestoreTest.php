<?php

use App\Actions\Advanced\GetBackupSettings;
use App\Jobs\PrepareBackupRestore;
use App\Models\User;
use App\Notifications\BackupProblemNotification;
use App\Support\BackupArchivePassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

function createEncryptedRecoveryFixture(string $password): void
{
    Storage::fake('backups');
    Storage::disk('backups')->makeDirectory('application');
    $path = Storage::disk('backups')->path('application/fixture.zip');

    $zip = new ZipArchive;

    if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException('Could not create the ZIP fixture.');
    }

    $zip->setPassword($password);
    $zip->addFromString('db-dumps/sqlite-sqlite-database.sql', "CREATE TABLE recovered_marker (value TEXT NOT NULL);\nINSERT INTO recovered_marker VALUES ('restored');\n");
    $zip->addFromString('storage/app/private/marker.txt', 'private file restored');
    $zip->setEncryptionName('db-dumps/sqlite-sqlite-database.sql', ZipArchive::EM_AES_256);
    $zip->setEncryptionName('storage/app/private/marker.txt', ZipArchive::EM_AES_256);
    $zip->close();

    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.name' => 'application']);
}

test('worker restores encrypted files and a valid SQLite database in isolation', function () {
    createEncryptedRecoveryFixture('correct-fixture-password');
    app(BackupArchivePassword::class)->store('correct-fixture-password');
    config(['backup.backup.password' => 'stale-worker-password']);
    $id = (string) Str::uuid();
    $target = storage_path('app/restore-staging/'.$id);

    DB::table('backup_restore_runs')->insert([
        'id' => $id,
        'requested_by' => User::factory()->create()->id,
        'disk' => 'backups',
        'archive' => 'fixture.zip',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    try {
        app()->call([new PrepareBackupRestore($id, 'backups', 'fixture.zip'), 'handle']);

        $this->assertDatabaseHas('backup_restore_runs', ['id' => $id, 'status' => 'completed']);
        expect(File::get($target.'/storage/app/private/marker.txt'))->toBe('private file restored');
        expect(Schema::hasTable('recovered_marker'))->toBeFalse();

        $restored = new PDO('sqlite:'.$target.'/database/restored.sqlite');
        expect($restored->query('SELECT value FROM recovered_marker')->fetchColumn())->toBe('restored');
    } finally {
        File::deleteDirectory($target);
    }
});

test('worker accepts the password of a historical ZIP without changing the configured password', function () {
    createEncryptedRecoveryFixture('historical-fixture-password');
    app(BackupArchivePassword::class)->store('new-current-password');
    $id = (string) Str::uuid();
    $target = storage_path('app/restore-staging/'.$id);

    DB::table('backup_restore_runs')->insert([
        'id' => $id,
        'requested_by' => User::factory()->create()->id,
        'disk' => 'backups',
        'archive' => 'fixture.zip',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    try {
        app()->call([new PrepareBackupRestore($id, 'backups', 'fixture.zip', 'historical-fixture-password'), 'handle']);

        $this->assertDatabaseHas('backup_restore_runs', ['id' => $id, 'status' => 'completed']);
        expect(config('backup.backup.password'))->toBe('new-current-password');
        expect(File::get($target.'/storage/app/private/marker.txt'))->toBe('private file restored');
    } finally {
        File::deleteDirectory($target);
    }
});

test('worker rejects an incorrect ZIP password without changing the active database', function () {
    createEncryptedRecoveryFixture('correct-fixture-password');
    config(['backup.backup.password' => 'incorrect-fixture-password']);
    $id = (string) Str::uuid();
    $target = storage_path('app/restore-staging/'.$id);

    DB::table('backup_restore_runs')->insert([
        'id' => $id,
        'requested_by' => User::factory()->create()->id,
        'disk' => 'backups',
        'archive' => 'fixture.zip',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    try {
        app()->call([new PrepareBackupRestore($id, 'backups', 'fixture.zip'), 'handle']);

        $this->assertDatabaseHas('backup_restore_runs', ['id' => $id, 'status' => 'failed']);
        expect(File::exists($target.'/database/restored.sqlite'))->toBeFalse();
        expect(Schema::hasTable('recovered_marker'))->toBeFalse();
    } finally {
        File::deleteDirectory($target);
    }
});

test('automatic verification restores a ZIP and removes its temporary copy', function () {
    createEncryptedRecoveryFixture('correct-fixture-password');
    app(BackupArchivePassword::class)->store('correct-fixture-password');
    $id = (string) Str::uuid();
    $target = storage_path('app/restore-staging/'.$id);

    DB::table('backup_restore_runs')->insert([
        'id' => $id,
        'disk' => 'backups',
        'archive' => 'fixture.zip',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    try {
        app()->call([new PrepareBackupRestore($id, 'backups', 'fixture.zip'), 'handle']);

        $this->assertDatabaseHas('backup_restore_runs', ['id' => $id, 'status' => 'completed']);
        expect(File::exists($target))->toBeFalse();
        expect(Schema::hasTable('recovered_marker'))->toBeFalse();
        $recentRun = app(GetBackupSettings::class)->handle()['restores'][0];
        expect($recentRun['automatic'])->toBeTrue();
        expect($recentRun['path'])->toBeNull();
    } finally {
        File::deleteDirectory($target);
    }
});

test('automatic verification reports a ZIP that cannot be decrypted', function () {
    createEncryptedRecoveryFixture('correct-fixture-password');
    config(['backup.backup.password' => 'incorrect-fixture-password']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('super-admin');
    Notification::fake();
    $id = (string) Str::uuid();
    $target = storage_path('app/restore-staging/'.$id);

    DB::table('backup_restore_runs')->insert([
        'id' => $id,
        'disk' => 'backups',
        'archive' => 'fixture.zip',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    try {
        app()->call([new PrepareBackupRestore($id, 'backups', 'fixture.zip'), 'handle']);

        $this->assertDatabaseHas('backup_restore_runs', ['id' => $id, 'status' => 'failed']);
        Notification::assertSentTo($admin, BackupProblemNotification::class);
        expect(File::exists($target))->toBeFalse();
    } finally {
        File::deleteDirectory($target);
    }
});
