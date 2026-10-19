<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;

class UpdatePermission
{
    /** @param array{name: string, label: string} $data */
    public function handle(Permission $permission, array $data): Permission
    {
        $permission->update($data);

        return $permission;
    }
}
