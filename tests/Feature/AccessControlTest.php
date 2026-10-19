<?php

use App\Models\Permission;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('a user without access permission cannot open access control', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('access-control.index'))
        ->assertForbidden();
});

test('super admin can open access control through the gate bypass', function () {
    $user = User::factory()->create();
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $user->assignRole('super-admin');

    $this->actingAs($user)
        ->get(route('access-control.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access-control/index')
            ->has('roles', 1)
            ->has('permissions', 0)
            ->where('stats.roles', 1)
        );
});

test('authorized users can manage roles and their permissions', function () {
    $user = User::factory()->create();
    $abilities = collect([
        'roles.create',
        'roles.update',
        'roles.delete',
    ])->map(fn (string $name) => Permission::create([
        'name' => $name,
        'label' => $name,
        'guard_name' => 'web',
    ]));
    $assignedPermission = Permission::create([
        'name' => 'reports.view',
        'label' => 'Ver reportes',
        'guard_name' => 'web',
    ]);
    $user->givePermissionTo($abilities);

    $this->actingAs($user)
        ->post(route('roles.store'), [
            'name' => 'supervisor',
            'permissions' => [$assignedPermission->id],
        ])
        ->assertRedirect();

    $role = Role::findByName('supervisor');
    expect($role->hasPermissionTo('reports.view'))->toBeTrue();

    $this->actingAs($user)
        ->put(route('roles.update', $role), [
            'name' => 'jefe-de-area',
            'permissions' => [],
        ])
        ->assertRedirect();

    expect($role->refresh()->name)->toBe('jefe-de-area')
        ->and($role->permissions)->toHaveCount(0);

    $this->actingAs($user)
        ->delete(route('roles.destroy', $role))
        ->assertRedirect();

    $this->assertDatabaseMissing('roles', ['id' => $role->id]);
});

test('authorized users can manage permissions', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(collect([
        'permissions.create',
        'permissions.update',
        'permissions.delete',
    ])->map(fn (string $name) => Permission::create([
        'name' => $name,
        'label' => $name,
        'guard_name' => 'web',
    ])));

    $this->actingAs($user)
        ->post(route('permissions.store'), [
            'name' => 'attendance.export',
            'label' => 'Exportar asistencias',
        ])
        ->assertRedirect();

    $permission = Permission::findByName('attendance.export');

    $this->actingAs($user)
        ->put(route('permissions.update', $permission), [
            'name' => 'attendance.view',
            'label' => 'Descargar asistencias',
        ])
        ->assertRedirect();

    expect($permission->refresh()->name)->toBe('attendance.view')
        ->and($permission->label)->toBe('Descargar asistencias');

    $this->actingAs($user)
        ->delete(route('permissions.destroy', $permission))
        ->assertRedirect();

    $this->assertDatabaseMissing('permissions', ['id' => $permission->id]);
});

test('permission identifiers require an english action and technical format', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(Permission::create([
        'name' => 'permissions.create',
        'label' => 'Crear permisos',
        'guard_name' => 'web',
    ]));

    $this->actingAs($user)
        ->post(route('permissions.store'), [
            'name' => 'permisos.eliminar',
            'label' => 'Eliminar permisos',
        ])
        ->assertSessionHasErrors('name');

    $this->assertDatabaseMissing('permissions', ['name' => 'permisos.eliminar']);
});

test('system roles cannot be deleted or renamed', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $user->assignRole($role);

    $this->actingAs($user)
        ->put(route('roles.update', $role), [
            'name' => 'otro-nombre',
            'permissions' => [],
        ])
        ->assertSessionHasErrors('name');

    $this->actingAs($user)
        ->delete(route('roles.destroy', $role))
        ->assertSessionHasErrors('role');

    $this->assertDatabaseHas('roles', ['id' => $role->id, 'name' => 'super-admin']);
});

test('the permission seeder assigns super admin and removes root', function () {
    $user = User::factory()->create();
    $root = Role::create(['name' => 'root', 'guard_name' => 'web']);
    Permission::create([
        'name' => 'legacy.permission',
        'label' => '',
        'guard_name' => 'web',
    ]);
    $user->assignRole($root);

    $this->seed(RolesAndPermissionsSeeder::class);

    expect($user->refresh()->hasRole('super-admin'))->toBeTrue()
        ->and($user->hasRole('root'))->toBeFalse()
        ->and(Role::query()->where('name', 'root')->doesntExist())->toBeTrue()
        ->and(Permission::findByName('legacy.permission')->label)->toBe('Legacy Permission')
        ->and(Permission::query()->count())->toBe(8)
        ->and(Role::query()->count())->toBe(3);
});
