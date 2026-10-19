<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateRole
{
    /** @param array{name: string, permissions?: array<int, int|string>} $data */
    public function handle(array $data): Role
    {
        return DB::transaction(function () use ($data): Role {
            $role = Role::create([
                'name' => $data['name'],
                'guard_name' => 'web',
            ]);

            $permissions = Permission::query()->findMany($data['permissions'] ?? []);
            $role->syncPermissions($permissions);
            AuditLog::query()->create([
                'actor_id' => Auth::id(), 'event' => 'permissions_synced', 'auditable_type' => $role::class,
                'auditable_id' => (string) $role->getKey(), 'auditable_label' => $role->name,
                'changes' => ['permissions' => $permissions->pluck('name')->values()->all()], 'ip_address' => Request::ip(),
            ]);

            return $role;
        });
    }
}
