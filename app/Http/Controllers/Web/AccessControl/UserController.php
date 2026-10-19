<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\CreateUser;
use App\Actions\AccessControl\DeleteUser;
use App\Actions\AccessControl\GetUsersData;
use App\Actions\AccessControl\UpdateUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserRequest;
use App\Http\Requests\AccessControl\UpdateUserRequest;
use App\Models\User;
use App\Notifications\AccountCreatedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request, GetUsersData $getUsersData): Response
    {
        Gate::authorize('users.view');
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);

        return Inertia::render('access-control/users', $getUsersData->handle($actor));
    }

    public function store(StoreUserRequest $request, CreateUser $createUser): RedirectResponse
    {
        $user = $createUser->handle($request->validated());
        $user->notify(new AccountCreatedNotification);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUser $updateUser): RedirectResponse
    {
        $updateUser->handle($user, $request->validated());

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(User $user, DeleteUser $deleteUser): RedirectResponse
    {
        Gate::authorize('users.delete');
        $actor = request()->user();
        abort_unless($actor instanceof User, 401);

        $deleteUser->handle($user, $actor);

        return back()->with('success', 'Usuario eliminado correctamente.');
    }
}
