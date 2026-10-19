<?php

use App\Http\Controllers\Web\AccessControl\AccessControlController;
use App\Http\Controllers\Web\AccessControl\PermissionController;
use App\Http\Controllers\Web\AccessControl\RoleController;
use App\Http\Controllers\Web\AccessControl\SocialLoginSettingsController;
use App\Http\Controllers\Web\AccessControl\UserController;
use App\Http\Controllers\Web\Advanced\ApplicationSettingsController;
use App\Http\Controllers\Web\Advanced\AuditLogController;
use App\Http\Controllers\Web\Advanced\IntegrationSettingsController;
use App\Http\Controllers\Web\Advanced\ManagedFileController;
use App\Http\Controllers\Web\Advanced\NotificationController;
use App\Http\Controllers\Web\Auth\SocialLoginController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('auth/{provider}/redirect', [SocialLoginController::class, 'redirect'])
    ->whereIn('provider', ['github', 'google'])
    ->name('social-login.redirect');
Route::get('auth/{provider}/callback', [SocialLoginController::class, 'callback'])
    ->whereIn('provider', ['github', 'google'])
    ->name('social-login.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::patch('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');

    Route::middleware('can:manage-advanced')->prefix('admin')->name('advanced.')->group(function (): void {
        Route::get('audit', AuditLogController::class)->name('audit.index');
        Route::get('files', [ManagedFileController::class, 'index'])->name('files.index');
        Route::post('files', [ManagedFileController::class, 'store'])->name('files.store');
        Route::get('files/{file}/preview', [ManagedFileController::class, 'preview'])->name('files.preview');
        Route::get('files/{file}/download', [ManagedFileController::class, 'download'])->name('files.download');
        Route::delete('files/{file}', [ManagedFileController::class, 'destroy'])->name('files.destroy');
        Route::get('settings', [ApplicationSettingsController::class, 'index'])->name('settings.index');
        Route::put('settings', [ApplicationSettingsController::class, 'update'])->name('settings.update');
        Route::put('settings/integrations', [IntegrationSettingsController::class, 'update'])->name('settings.integrations.update');
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
    Route::patch('access-control/users/{user}', [UserController::class, 'update'])
        ->name('access-control.users.update');
    Route::delete('access-control/users/{user}', [UserController::class, 'destroy'])
        ->name('access-control.users.destroy');
    Route::resource('roles', RoleController::class)
        ->only(['store', 'update', 'destroy']);
    Route::resource('permissions', PermissionController::class)
        ->only(['store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
