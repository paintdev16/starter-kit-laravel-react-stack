<?php

use App\Http\Controllers\Web\Settings\ApiTokenController;
use App\Http\Controllers\Web\Settings\BrowserSessionController;
use App\Http\Controllers\Web\Settings\ProfileController;
use App\Http\Controllers\Web\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('settings', fn () => redirect('/profile'));

    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');

    Route::post('profile/tokens', [ApiTokenController::class, 'store'])
        ->middleware(['verified', 'throttle:6,1'])
        ->name('profile.tokens.store');
    Route::delete('profile/tokens', [ApiTokenController::class, 'destroyAll'])
        ->middleware('throttle:6,1')
        ->name('profile.tokens.destroy-all');
    Route::delete('profile/tokens/{token}', [ApiTokenController::class, 'destroy'])
        ->whereNumber('token')
        ->middleware('throttle:6,1')
        ->name('profile.tokens.destroy');

    Route::delete('profile/sessions', [BrowserSessionController::class, 'destroyOthers'])
        ->middleware('throttle:6,1')
        ->name('profile.sessions.destroy-others');
    Route::delete('profile/sessions/{session}', [BrowserSessionController::class, 'destroy'])
        ->where('session', '[a-f0-9]{64}')
        ->middleware('throttle:6,1')
        ->name('profile.sessions.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::put('profile/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('profile.edit'),
        'manage' => route('profile.edit'),
    ]);
})->name('well-known.passkeys');
