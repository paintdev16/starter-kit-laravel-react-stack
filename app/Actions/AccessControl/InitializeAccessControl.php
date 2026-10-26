<?php

namespace App\Actions\AccessControl;

use App\Models\Permission;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class InitializeAccessControl
{
    public function handle(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect([
            'access-control.view' => 'Ver roles y permisos',
            'roles.create' => 'Crear roles',
            'roles.update' => 'Editar roles',
            'roles.delete' => 'Eliminar roles',
            'permissions.create' => 'Crear permisos',
            'permissions.update' => 'Editar permisos',
            'permissions.delete' => 'Eliminar permisos',
            'users.view' => 'Ver usuarios',
            'users.create' => 'Crear usuarios',
            'users.invite' => 'Invitar usuarios',
            'users.update' => 'Editar usuarios y accesos',
            'users.suspend' => 'Suspender usuarios y revocar accesos',
            'users.delete' => 'Eliminar usuarios',
        ])->mapWithKeys(function (string $label, string $name): array {
            $permission = Permission::findOrCreate($name, 'web');
            $permission->update(['label' => $label]);

            return [$name => $permission];
        });

        Permission::query()->where('label', '')->get()->each(function (Permission $permission): void {
            $permission->update([
                'label' => Str::headline(str_replace(['.', '-'], ' ', $permission->name)),
            ]);
        });

        Role::query()->where('name', 'root')->where('guard_name', 'web')->get()->each->delete();

        $superAdmin = Role::findOrCreate('super-admin', 'web');
        $administrator = Role::findOrCreate('administrador', 'web');
        Role::findOrCreate('usuario', 'web');

        $superAdmin->syncPermissions($permissions->values());
        $administrator->syncPermissions($permissions->except([
            'roles.delete', 'permissions.delete', 'users.delete',
        ])->values());

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
