<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\ManageUserLifecycle;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class UserSuspensionController extends Controller
{
    public function store(User $user, ManageUserLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('users.suspend');
        $actor = request()->user();
        abort_unless($actor instanceof User, 401);

        $lifecycle->suspend($user, $actor);

        return back()->with('success', 'Cuenta suspendida y accesos revocados.');
    }

    public function destroy(User $user, ManageUserLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('users.suspend');
        $actor = request()->user();
        abort_unless($actor instanceof User, 401);

        $lifecycle->activate($user, $actor);

        return back()->with('success', 'Cuenta reactivada.');
    }

    public function revokeAccess(User $user, ManageUserLifecycle $lifecycle): RedirectResponse
    {
        Gate::authorize('users.suspend');
        $actor = request()->user();
        abort_unless($actor instanceof User, 401);

        $lifecycle->revokeAccess($user, $actor);

        return back()->with('success', 'Se cerraron las sesiones y se revocaron los tokens de la cuenta.');
    }
}
