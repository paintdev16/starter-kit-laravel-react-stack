<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

class GetAccessControlData
{
    /**
     * @return array{
     *     roles: Collection,
     *     permissions: Collection,
     *     stats: array{
     *         roles: int,
     *         permissions: int,
     *         usersWithRoles: int
     *     }
     * }
     */
    public function handle(User $actor): array
    {
        $rolesQuery = Role::query()
            ->with(['permissions:id,name,label'])
            ->withCount(['users' => function ($query) use ($actor): void {
                if (! $actor->hasRole('super-admin')) {
                    $query->whereDoesntHave('roles', fn ($roles) => $roles->where('name', 'super-admin'));
                }
            }])
            ->orderBy('name');

        if (! $actor->hasRole('super-admin')) {
            $rolesQuery->where('name', '!=', 'super-admin');
        }

        $roles = $rolesQuery->get(['id', 'name', 'guard_name']);

        $permissions = Permission::query()
            ->withCount('roles')
            ->orderBy('name')
            ->get(['id', 'name', 'label', 'guard_name']);

        return [
            'roles' => $roles,
            'permissions' => $permissions,
            'stats' => [
                'roles' => $roles->count(),
                'permissions' => $permissions->count(),
                'usersWithRoles' => User::query()
                    ->when(! $actor->hasRole('super-admin'), fn ($query) => $query->whereDoesntHave('roles', fn ($roles) => $roles->where('name', 'super-admin')))
                    ->whereHas('roles')
                    ->count(),
            ],
        ];
    }
}
