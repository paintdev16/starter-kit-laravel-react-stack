<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\CreatePermission;
use App\Actions\AccessControl\DeletePermission;
use App\Actions\AccessControl\GetAccessControlData;
use App\Actions\AccessControl\UpdatePermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StorePermissionRequest;
use App\Http\Requests\AccessControl\UpdatePermissionRequest;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    public function index(Request $request, GetAccessControlData $getAccessControlData): Response
    {
        Gate::authorize('access-control.view');
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);

        return Inertia::render('access-control/permissions', $getAccessControlData->handle($actor));
    }

    public function store(StorePermissionRequest $request, CreatePermission $createPermission): RedirectResponse
    {
        $createPermission->handle($request->validated());

        return back()->with('success', 'Permiso creado correctamente.');
    }

    public function update(
        UpdatePermissionRequest $request,
        Permission $permission,
        UpdatePermission $updatePermission,
    ): RedirectResponse {
        $updatePermission->handle($permission, $request->safe()->only(['name', 'label']));

        return back()->with('success', 'Permiso actualizado correctamente.');
    }

    public function destroy(Permission $permission, DeletePermission $deletePermission): RedirectResponse
    {
        Gate::authorize('permissions.delete');
        $deletePermission->handle($permission);

        return back()->with('success', 'Permiso eliminado correctamente.');
    }
}
