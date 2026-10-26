<?php

namespace App\Actions\AccessControl;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ManageUserLifecycle
{
    public function suspend(User $user, User $actor): void
    {
        $this->ensureManageable($user, $actor);

        DB::transaction(function () use ($user, $actor): void {
            if (! $user->is_active) {
                return;
            }

            $user->forceFill([
                'is_active' => false,
                'session_version' => $user->session_version + 1,
                'remember_token' => Str::random(60),
            ])->save();

            $this->revokeCredentials($user, revokePasskeys: true);
            $this->audit($actor, $user, 'user_suspended');
        });
    }

    public function activate(User $user, User $actor): void
    {
        $this->ensureManageable($user, $actor);

        if ($user->is_active) {
            return;
        }

        DB::transaction(function () use ($actor, $user): void {
            $user->forceFill(['is_active' => true])->save();
            $this->audit($actor, $user, 'user_activated');
        });
    }

    public function revokeAccess(User $user, User $actor): void
    {
        $this->ensureManageable($user, $actor);

        DB::transaction(function () use ($user, $actor): void {
            $user->forceFill([
                'session_version' => $user->session_version + 1,
                'remember_token' => Str::random(60),
            ])->save();

            $this->revokeCredentials($user);
            $this->audit($actor, $user, 'user_access_revoked');
        });
    }

    private function ensureManageable(User $user, User $actor): void
    {
        if ($user->is($actor)) {
            throw ValidationException::withMessages([
                'user' => 'No puedes suspender ni revocar el acceso de tu propia cuenta.',
            ]);
        }

        if ($user->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'user' => 'Las cuentas super-admin están protegidas.',
            ]);
        }
    }

    private function revokeCredentials(User $user, bool $revokePasskeys = false): void
    {
        $user->tokens()->delete();

        if ($revokePasskeys) {
            $user->passkeys()->delete();
        }

        if (config('session.driver') === 'database' && Schema::hasTable(config('session.table', 'sessions'))) {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }

    private function audit(User $actor, User $user, string $event): void
    {
        AuditLog::query()->create([
            'actor_id' => $actor->id,
            'event' => $event,
            'auditable_type' => User::class,
            'auditable_id' => (string) $user->getKey(),
            'auditable_label' => $user->name,
            'changes' => ['is_active' => $user->is_active, 'session_version' => $user->session_version],
            'ip_address' => Request::ip(),
        ]);
    }
}
