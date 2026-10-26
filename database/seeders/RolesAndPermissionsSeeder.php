<?php

namespace Database\Seeders;

use App\Actions\AccessControl\InitializeAccessControl;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(InitializeAccessControl $initializeAccessControl): void
    {
        $initializeAccessControl->handle();

        $currentUser = User::query()->oldest('id')->first();

        if ($currentUser !== null) {
            $currentUser->syncRoles([Role::findByName('super-admin', 'web')]);
        }
    }
}
