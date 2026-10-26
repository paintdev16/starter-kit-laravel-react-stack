<?php

use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\TokenController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Middleware\EnsureActiveAccount;
use App\Http\Middleware\EnsureSanctumEnabled;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(EnsureSanctumEnabled::class)->group(function (): void {
    Route::post('auth/token', [TokenController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('api.v1.auth.token.store');

    Route::middleware(['auth:sanctum', EnsureActiveAccount::class, 'abilities:api:read'])->group(function (): void {
        Broadcast::routes(['middleware' => ['auth:sanctum', 'abilities:api:read']]);

        Route::get('me', [ProfileController::class, 'show'])->name('api.v1.me');
        Route::get('notifications', [NotificationController::class, 'index'])->name('api.v1.notifications.index');
        Route::get('users', [UserController::class, 'index'])->middleware('can:users.view')->name('api.v1.users.index');
        Route::get('users/{user}', [UserController::class, 'show'])->middleware('can:users.view')->name('api.v1.users.show');
    });

    Route::middleware(['auth:sanctum', EnsureActiveAccount::class, 'abilities:api:write'])->group(function (): void {
        Route::delete('auth/token', [TokenController::class, 'destroy'])->name('api.v1.auth.token.destroy');
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'read'])->name('api.v1.notifications.read');
        Route::patch('notifications/read-all', [NotificationController::class, 'readAll'])->name('api.v1.notifications.read-all');
    });
});
