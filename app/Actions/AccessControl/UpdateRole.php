<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UpdateRole
{
    /** @param array{name: string, permissions?: array<int, int|string>} $data */
    public function handle(Role $role, array $data, User $actor): Role
    {
        abort_unless($role->name !== 'super-admin' || $actor->hasRole('super-admin'), 404);

        if ($role->name === 'super-admin' && $data['name'] !== $role->name) {
            throw ValidationException::withMessages([
                'name' => 'El rol super-admin no se puede renombrar.',
            ]);
        }

        return DB::transaction(function () use ($role, $data, $actor): Role {
            $previousPermissions = $role->permissions()->pluck('name')->values()->all();
            $role->update(['name' => $data['name']]);
            $permissions = Permission::query()->findMany($data['permissions'] ?? []);
            $role->syncPermissions($permissions);
            AuditLog::query()->create([
                'actor_id' => $actor->id, 'event' => 'permissions_synced', 'auditable_type' => $role::class,
                'auditable_id' => (string) $role->getKey(), 'auditable_label' => $role->name,
                'changes' => ['from' => $previousPermissions, 'to' => $permissions->pluck('name')->values()->all()], 'ip_address' => Request::ip(),
            ]);

            return $role;
        });
    }
}
