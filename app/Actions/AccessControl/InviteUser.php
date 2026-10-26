<?php

namespace App\Actions\AccessControl;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\UserInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class InviteUser
{
    /** @param array{name: string, email: string, roles?: array<int, int>} $data */
    public function handle(User $actor, array $data): UserInvitation
    {
        $token = Str::random(64);
        $email = Str::lower($data['email']);

        $invitation = DB::transaction(function () use ($actor, $data, $email, $token): UserInvitation {
            if (User::query()->whereRaw('LOWER(email) = ?', [$email])->lockForUpdate()->exists()) {
                throw ValidationException::withMessages([
                    'email' => 'Ya existe una cuenta con este correo.',
                ]);
            }

            UserInvitation::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->whereNull('accepted_at')
                ->whereNull('canceled_at')
                ->update(['canceled_at' => now()]);

            $roleIds = Role::query()
                ->whereKey($data['roles'] ?? [])
                ->where('guard_name', 'web')
                ->where('name', '!=', 'super-admin')
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->all();

            $invitation = UserInvitation::query()->create([
                'name' => $data['name'],
                'email' => $email,
                'role_ids' => $roleIds,
                'invited_by' => $actor->id,
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addDays(7),
            ]);

            $this->audit($actor, $invitation, 'user_invited');

            return $invitation;
        });

        $invitation->notify(new UserInvitationNotification(
            route('invitations.show', ['invitation' => $invitation, 'token' => $token]),
        ));

        return $invitation;
    }

    public function resend(User $actor, UserInvitation $invitation): void
    {
        abort_if($invitation->accepted_at !== null || $invitation->canceled_at !== null, 422, 'Esta invitación ya no está pendiente.');

        $token = Str::random(64);
        DB::transaction(function () use ($actor, $invitation, $token): void {
            $invitation->forceFill([
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addDays(7),
                'invited_by' => $actor->id,
            ])->save();

            $this->audit($actor, $invitation, 'invitation_resent');
        });

        $invitation->notify(new UserInvitationNotification(
            route('invitations.show', ['invitation' => $invitation, 'token' => $token]),
        ));
    }

    private function audit(User $actor, UserInvitation $invitation, string $event): void
    {
        AuditLog::query()->create([
            'actor_id' => $actor->id,
            'event' => $event,
            'auditable_type' => UserInvitation::class,
            'auditable_id' => (string) $invitation->getKey(),
            'auditable_label' => $invitation->email,
            'changes' => ['email' => $invitation->email],
            'ip_address' => Request::ip(),
        ]);
    }
}
