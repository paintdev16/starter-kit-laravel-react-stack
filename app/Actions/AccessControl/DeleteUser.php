<?php

namespace App\Actions\AccessControl;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DeleteUser
{
    public function handle(User $user, User $actor): void
    {
        if ($user->is($actor)) {
            throw ValidationException::withMessages([
                'user' => 'No puedes eliminar tu propia cuenta.',
            ]);
        }

        if ($user->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'user' => 'La cuenta super-admin está protegida.',
            ]);
        }

        $avatars = $user->avatars()->get(['disk', 'path']);
        $user->tokens()->delete();
        $user->passkeys()->delete();

        if (config('session.driver') === 'database' && Schema::hasTable(config('session.table', 'sessions'))) {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }

        $user->delete();

        $avatars->each(fn ($avatar) => Storage::disk($avatar->disk)->delete($avatar->path));
    }
}
