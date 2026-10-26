<?php

namespace App\Actions\AccessControl;

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

class GetUsersData
{
    /**
     * @return array{users: Collection, invitations: Collection, roles: Collection, stats: array{users: int, withRoles: int, superAdmins: int, suspended: int, pendingInvitations: int}}
     */
    public function handle(User $actor): array
    {
        $users = User::query()
            ->when(! $actor->hasRole('super-admin'), fn ($query) => $query->whereDoesntHave('roles', fn ($roles) => $roles->where('name', 'super-admin')))
            ->with([
                'latestAvatar',
                'roles:id,name',
                'roles.permissions:id,name,label',
            ])
            ->withCount('roles')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'email_verified_at', 'created_at', 'is_active']);

        $users->each(function (User $user): void {
            $user->setAttribute('avatar_url', $user->latestAvatar?->url);
            $user->unsetRelation('latestAvatar');
        });

        $invitations = $actor->can('users.invite')
            ? UserInvitation::query()
                ->whereNull('accepted_at')
                ->whereNull('canceled_at')
                ->latest('created_at')
                ->limit(10)
                ->get(['id', 'name', 'email', 'role_ids', 'expires_at', 'created_at'])
            : collect();
        $roleNames = Role::query()
            ->whereKey($invitations->flatMap(fn (UserInvitation $invitation): array => $invitation->role_ids)->unique())
            ->orderBy('name')
            ->pluck('name', 'id');
        $invitations->each(function (UserInvitation $invitation) use ($roleNames): void {
            $invitation->setAttribute('roles', collect($invitation->role_ids)
                ->map(fn (int $id): ?string => $roleNames->get($id))
                ->filter()
                ->values()
                ->all());
        });

        return [
            'users' => $users,
            'invitations' => $invitations,
            'roles' => Role::query()
                ->where('guard_name', 'web')
                ->where('name', '!=', 'super-admin')
                ->with(['permissions:id,name,label'])
                ->withCount('users')
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'users' => $users->count(),
                'withRoles' => $users->filter(fn (User $user): bool => $user->roles_count > 0)->count(),
                'superAdmins' => $actor->hasRole('super-admin')
                    ? User::query()->whereHas('roles', fn ($roles) => $roles->where('name', 'super-admin'))->count()
                    : 0,
                'suspended' => $users->where('is_active', false)->count(),
                'pendingInvitations' => $invitations->count(),
            ],
        ];
    }
}
