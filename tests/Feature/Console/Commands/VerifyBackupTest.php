<?php

use App\Jobs\PrepareBackupRestore;
use App\Models\ApplicationSetting;
use App\Models\User;
use App\Notifications\BackupProblemNotification;
use App\Support\ApplicationFeatures;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

test('verification pauses with automatic backups', function () {
    ApplicationSetting::query()->create(['key' => ApplicationFeatures::BACKUPS, 'value' => '0']);
    Queue::fake([PrepareBackupRestore::class]);

    $this->artisan('backup:verify')->assertSuccessful();

    $this->assertDatabaseCount('backup_restore_runs', 0);
    Queue::assertNotPushed(PrepareBackupRestore::class);
});

test('verification queues the latest ZIP and waits seven days after success', function () {
    Storage::fake('backups');
    Storage::disk('backups')->put('application/recent.zip', 'archive fixture');
    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.name' => 'application']);
    Queue::fake([PrepareBackupRestore::class]);

    $this->artisan('backup:verify')->assertSuccessful();

    $this->assertDatabaseHas('backup_restore_runs', ['archive' => 'recent.zip', 'requested_by' => null, 'status' => 'pending']);
    Queue::assertPushed(PrepareBackupRestore::class, 1);

    DB::table('backup_restore_runs')->update(['status' => 'completed', 'finished_at' => now()]);

    $this->artisan('backup:verify')->assertSuccessful();

    $this->assertDatabaseCount('backup_restore_runs', 1);
    Queue::assertPushed(PrepareBackupRestore::class, 1);
});

test('missing backup is recorded and alerts super admins', function () {
    Storage::fake('backups');
    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.name' => 'application']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('super-admin');
    Notification::fake();
    Queue::fake([PrepareBackupRestore::class]);

    $this->artisan('backup:verify')->assertFailed();

    $this->assertDatabaseHas('backup_restore_runs', ['archive' => 'Ninguno', 'status' => 'failed']);
    Notification::assertSentTo($admin, BackupProblemNotification::class);
    Queue::assertNotPushed(PrepareBackupRestore::class);
});

test('stalled verification fails and alerts before scheduling another attempt', function () {
    Storage::fake('backups');
    Storage::disk('backups')->put('application/recent.zip', 'archive fixture');
    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.name' => 'application']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('super-admin');
    Notification::fake();
    Queue::fake([PrepareBackupRestore::class]);
    $stalledId = (string) Str::uuid();
    DB::table('backup_restore_runs')->insert([
        'id' => $stalledId,
        'disk' => 'backups',
        'archive' => 'old.zip',
        'status' => 'pending',
        'created_at' => now()->subHours(5),
        'updated_at' => now()->subHours(5),
    ]);

    $this->artisan('backup:verify')->assertSuccessful();

    $this->assertDatabaseHas('backup_restore_runs', ['id' => $stalledId, 'status' => 'failed']);
    $this->assertDatabaseHas('backup_restore_runs', ['archive' => 'recent.zip', 'status' => 'pending']);
    Notification::assertSentTo($admin, BackupProblemNotification::class);
    Queue::assertPushed(PrepareBackupRestore::class, 1);
});
