<?php

use App\Jobs\PrepareBackupRestore;
use App\Models\ApplicationSetting;
use App\Models\User;
use App\Support\ApplicationFeatures;
use App\Support\BackupArchivePassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

test('guest and regular user cannot change backup settings', function () {
    $this->put(route('advanced.settings.backups.update'), ['enabled' => false])
        ->assertRedirect(route('login'));

    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('advanced.settings.backups.update'), ['enabled' => false])
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('advanced.settings.backups.password.update'), [
            'current_password' => 'password',
            'password' => 'new-backup-password-123',
            'password_confirmation' => 'new-backup-password-123',
        ])
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('advanced.settings.backups.restore'), [
            'archive' => 'fixture.zip',
            'confirmation' => true,
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('application_settings', 0);
    $this->assertDatabaseCount('backup_restore_runs', 0);
});

test('super admin can pause and resume scheduled backups', function () {
    $admin = User::factory()->create();
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin->assignRole('super-admin');

    $this->actingAs($admin)
        ->put(route('advanced.settings.backups.update'), ['enabled' => false])
        ->assertRedirect();

    $this->assertDatabaseHas('application_settings', ['key' => ApplicationFeatures::BACKUPS, 'value' => '0']);
    expect(app(ApplicationFeatures::class)->backupsEnabled())->toBeFalse();
    $backupEvents = collect(Schedule::events())
        ->filter(fn ($event): bool => str_contains($event->command, 'backup:'))
        ->values();
    expect($backupEvents)->toHaveCount(4);

    foreach ($backupEvents as $event) {
        expect($event->filtersPass(app()))->toBeFalse();
    }

    $this->actingAs($admin)
        ->put(route('advanced.settings.backups.update'), ['enabled' => true])
        ->assertRedirect();

    $this->assertDatabaseHas('application_settings', ['key' => ApplicationFeatures::BACKUPS, 'value' => '1']);
    expect(app(ApplicationFeatures::class)->backupsEnabled())->toBeTrue();

    foreach ($backupEvents as $event) {
        expect($event->filtersPass(app()))->toBeTrue();
    }
});

test('super admin changes the zip password only after confirming the account password', function () {
    $admin = User::factory()->create();
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin->assignRole('super-admin');
    $newPassword = 'new-backup-password-123';

    $this->actingAs($admin)
        ->put(route('advanced.settings.backups.password.update'), [
            'current_password' => 'incorrect',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ])
        ->assertSessionHasErrors('current_password');

    $this->assertDatabaseMissing('application_settings', ['key' => BackupArchivePassword::SETTING]);

    $this->actingAs($admin)
        ->put(route('advanced.settings.backups.password.update'), [
            'current_password' => 'password',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ])
        ->assertRedirect();

    $stored = ApplicationSetting::query()->whereKey(BackupArchivePassword::SETTING)->value('value');
    expect($stored)->toBeString()->not->toBe($newPassword);

    config(['backup.backup.password' => 'old-password']);
    app(BackupArchivePassword::class)->apply();
    expect(config('backup.backup.password'))->toBe($newPassword);
});

test('restore request queues an isolated recovery without storing the entered password', function () {
    $admin = User::factory()->create();
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin->assignRole('super-admin');
    Storage::fake('backups');
    Storage::disk('backups')->put('application/fixture.zip', 'zip contents are checked by the worker');
    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.name' => 'application']);
    Queue::fake([PrepareBackupRestore::class]);

    $this->actingAs($admin)
        ->post(route('advanced.settings.backups.restore'), [
            'archive' => 'fixture.zip',
            'confirmation' => true,
            'password' => 'historical-zip-password',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('backup_restore_runs', [
        'requested_by' => $admin->id,
        'archive' => 'fixture.zip',
        'status' => 'pending',
    ]);
    expect(json_encode(DB::table('backup_restore_runs')->first()))->not->toContain('historical-zip-password');
    Queue::assertPushed(PrepareBackupRestore::class, fn (PrepareBackupRestore $job): bool => $job->archive === 'fixture.zip');
});

test('restore request rejects paths and a second concurrent recovery', function () {
    $admin = User::factory()->create();
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin->assignRole('super-admin');
    Storage::fake('backups');
    Storage::disk('backups')->put('application/fixture.zip', 'fixture');
    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.name' => 'application']);
    Queue::fake([PrepareBackupRestore::class]);

    $this->actingAs($admin)
        ->post(route('advanced.settings.backups.restore'), [
            'archive' => '../fixture.zip',
            'confirmation' => true,
        ])
        ->assertSessionHasErrors('archive');

    $this->assertDatabaseCount('backup_restore_runs', 0);

    DB::table('backup_restore_runs')->insert([
        'id' => (string) Str::uuid(),
        'requested_by' => $admin->id,
        'disk' => 'backups',
        'archive' => 'fixture.zip',
        'status' => 'running',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post(route('advanced.settings.backups.restore'), [
            'archive' => 'fixture.zip',
            'confirmation' => true,
        ])
        ->assertSessionHasErrors('archive');

    $this->assertDatabaseCount('backup_restore_runs', 1);
    Queue::assertNotPushed(PrepareBackupRestore::class);
});
