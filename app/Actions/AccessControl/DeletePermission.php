<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;

class DeletePermission
{
    public function handle(Permission $permission): void
    {
        $permission->delete();
    }
}
