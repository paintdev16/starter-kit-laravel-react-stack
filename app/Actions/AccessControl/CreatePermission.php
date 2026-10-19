<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreatePermission
{
    /** @param array{name: string, label: string} $data */
    public function handle(array $data): Permission
    {
        return DB::transaction(function () use ($data): Permission {
            $permission = Permission::create([
                'name' => $data['name'],
                'label' => $data['label'],
                'guard_name' => 'web',
            ]);

            $superAdmin = Role::findOrCreate('super-admin', 'web');
            $superAdmin->givePermissionTo($permission);

            return $permission;
        });
    }
}
