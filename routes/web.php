<?php

use App\Http\Controllers\Web\AccessControl\AccessControlController;
use App\Http\Controllers\Web\AccessControl\PermissionController;
use App\Http\Controllers\Web\AccessControl\RoleController;
use App\Http\Controllers\Web\AccessControl\SocialLoginSettingsController;
use App\Http\Controllers\Web\AccessControl\UserController;
use App\Http\Controllers\Web\AccessControl\UserInvitationController;
use App\Http\Controllers\Web\AccessControl\UserSuspensionController;
use App\Http\Controllers\Web\Advanced\ApplicationSettingsController;
use App\Http\Controllers\Web\Advanced\AuditLogController;
use App\Http\Controllers\Web\Advanced\BackupSettingsController;
use App\Http\Controllers\Web\Advanced\IntegrationSettingsController;
use App\Http\Controllers\Web\Advanced\NotificationController;
use App\Http\Controllers\Web\Advanced\SystemHealthController;
use App\Http\Controllers\Web\Auth\InvitationAcceptanceController;
use App\Http\Controllers\Web\Auth\SocialLoginController;
use App\Http\Controllers\Web\Setup\InstallationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('setup', [InstallationController::class, 'show'])->name('setup.show');
Route::post('setup', [InstallationController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('setup.store');

Route::get('auth/{provider}/redirect', [SocialLoginController::class, 'redirect'])
    ->whereIn('provider', ['github', 'google'])
    ->name('social-login.redirect');
Route::get('auth/{provider}/callback', [SocialLoginController::class, 'callback'])
    ->whereIn('provider', ['github', 'google'])
    ->name('social-login.callback');

Route::get('invitations/{invitation}/{token}', [InvitationAcceptanceController::class, 'show'])
    ->where('token', '[A-Za-z0-9]+')
    ->name('invitations.show');
Route::post('invitations/{invitation}/{token}', [InvitationAcceptanceController::class, 'store'])
    ->where('token', '[A-Za-z0-9]+')
    ->name('invitations.accept');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('notifications', [NotificationController::class, 'latest'])->name('notifications.latest');
    Route::get('notifications/feed', [NotificationController::class, 'feed'])->name('notifications.feed');
    Route::get('notifications/runtime', [NotificationController::class, 'runtime'])->name('notifications.runtime');
    Route::patch('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::get('notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');

    Route::middleware('can:manage-advanced')->prefix('admin')->name('advanced.')->group(function (): void {
        Route::get('audit', AuditLogController::class)->name('audit.index');
        Route::get('health', SystemHealthController::class)->name('health.index');
        Route::get('settings', [ApplicationSettingsController::class, 'index'])->name('settings.index');
        Route::put('settings', [ApplicationSettingsController::class, 'update'])->name('settings.update');
        Route::put('settings/integrations', [IntegrationSettingsController::class, 'update'])->name('settings.integrations.update');
        Route::put('settings/backups', [BackupSettingsController::class, 'update'])->name('settings.backups.update');
        Route::put('settings/backups/password', [BackupSettingsController::class, 'updatePassword'])->middleware('throttle:5,1')->name('settings.backups.password.update');
        Route::post('settings/backups/restore', [BackupSettingsController::class, 'restore'])->middleware('throttle:3,1')->name('settings.backups.restore');
    });

    Route::get('access-control', [UserController::class, 'index'])
        ->name('access-control.index');
    Route::get('access-control/roles', AccessControlController::class)
        ->name('access-control.roles.index');
    Route::get('access-control/permissions', [PermissionController::class, 'index'])
        ->name('access-control.permissions.index');
    Route::get('access-control/social-login', [SocialLoginSettingsController::class, 'index'])
        ->middleware('can:social-login.manage')
        ->name('access-control.social-login.index');
    Route::post('access-control/social-login', [SocialLoginSettingsController::class, 'store'])
        ->middleware('can:social-login.manage')
        ->name('access-control.social-login.store');
    Route::patch('access-control/social-login/{provider}', [SocialLoginSettingsController::class, 'update'])
        ->whereIn('provider', ['github', 'google'])
        ->middleware('can:social-login.manage')
        ->name('access-control.social-login.update');
    Route::delete('access-control/social-login/{provider}', [SocialLoginSettingsController::class, 'destroy'])
        ->whereIn('provider', ['github', 'google'])
        ->middleware('can:social-login.manage')
        ->name('access-control.social-login.destroy');
    Route::get('access-control/users', fn () => redirect()->route('access-control.index'))
        ->name('access-control.users.index');
    Route::post('access-control/users', [UserController::class, 'store'])
        ->name('access-control.users.store');
    Route::post('access-control/invitations', [UserInvitationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('access-control.invitations.store');
    Route::post('access-control/invitations/{invitation}/resend', [UserInvitationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('access-control.invitations.resend');
    Route::delete('access-control/invitations/{invitation}', [UserInvitationController::class, 'destroy'])
        ->name('access-control.invitations.destroy');
    Route::patch('access-control/users/{user}', [UserController::class, 'update'])
        ->name('access-control.users.update');
    Route::delete('access-control/users/{user}', [UserController::class, 'destroy'])
        ->name('access-control.users.destroy');
    Route::put('access-control/users/{user}/suspension', [UserSuspensionController::class, 'store'])
        ->name('access-control.users.suspension.store');
    Route::delete('access-control/users/{user}/suspension', [UserSuspensionController::class, 'destroy'])
        ->name('access-control.users.suspension.destroy');
    Route::delete('access-control/users/{user}/sessions', [UserSuspensionController::class, 'revokeAccess'])
        ->name('access-control.users.sessions.destroy');
    Route::resource('roles', RoleController::class)
        ->only(['store', 'update', 'destroy']);
    Route::resource('permissions', PermissionController::class)
        ->only(['store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
