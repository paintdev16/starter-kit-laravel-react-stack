<?php

namespace App\Actions\AccessControl;

use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class DeleteRole
{
    public function handle(Role $role): void
    {
        if ($role->name === 'super-admin') {
            throw ValidationException::withMessages([
                'role' => 'El rol super-admin está protegido.',
            ]);
        }

        $role->delete();
    }
}
