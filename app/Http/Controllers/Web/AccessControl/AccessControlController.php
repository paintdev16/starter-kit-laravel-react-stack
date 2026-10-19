<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\GetAccessControlData;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AccessControlController extends Controller
{
    public function __invoke(Request $request, GetAccessControlData $getAccessControlData): Response
    {
        Gate::authorize('access-control.view');
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);

        return Inertia::render('access-control/roles', $getAccessControlData->handle($actor));
    }
}
