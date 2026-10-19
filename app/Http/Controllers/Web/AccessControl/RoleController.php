<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\CreateRole;
use App\Actions\AccessControl\DeleteRole;
use App\Actions\AccessControl\UpdateRole as UpdateRoleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreRoleRequest;
use App\Http\Requests\AccessControl\UpdateRoleRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function store(StoreRoleRequest $request, CreateRole $createRole): RedirectResponse
    {
        $createRole->handle($request->validated());

        return back()->with('success', 'Rol creado correctamente.');
    }

    public function update(UpdateRoleRequest $request, Role $role, UpdateRoleAction $updateRole): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);

        $updateRole->handle($role, $request->validated(), $actor);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function destroy(Role $role, DeleteRole $deleteRole): RedirectResponse
    {
        Gate::authorize('roles.delete');
        $deleteRole->handle($role);

        return back()->with('success', 'Rol eliminado correctamente.');
    }
}
