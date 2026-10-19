<?php

namespace App\Actions\AccessControl;

use App\Models\User;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

class GetUsersData
{
    /**
     * @return array{users: Collection, roles: Collection, stats: array{users: int, withRoles: int, superAdmins: int}}
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
            ->get(['id', 'name', 'email', 'email_verified_at', 'created_at']);

        $users->each(function (User $user): void {
            $user->setAttribute('avatar_url', $user->latestAvatar?->url);
            $user->unsetRelation('latestAvatar');
        });

        return [
            'users' => $users,
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
            ],
        ];
    }
}
