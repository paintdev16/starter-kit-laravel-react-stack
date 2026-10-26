<?php

namespace App\Http\Controllers\Web\Settings;

use App\Actions\Settings\ManageApiTokens;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\RevokeApiTokenRequest;
use App\Http\Requests\Settings\StoreApiTokenRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ApiTokenController extends Controller
{
    public function store(StoreApiTokenRequest $request, ManageApiTokens $tokens): JsonResponse
    {
        return response()->json($tokens->create($request->user(), $request->validated()), 201)
            ->header('Cache-Control', 'no-store, private')
            ->header('Pragma', 'no-cache');
    }

    public function destroy(RevokeApiTokenRequest $request, ManageApiTokens $tokens, int $token): RedirectResponse
    {
        $tokens->revoke($request->user(), $token);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Token revocado. Ya no permite acceder a la API.']);

        return to_route('profile.edit');
    }

    public function destroyAll(RevokeApiTokenRequest $request, ManageApiTokens $tokens): RedirectResponse
    {
        $count = $tokens->revoke($request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => $count > 0 ? 'Todos tus tokens API fueron revocados.' : 'No había tokens para revocar.']);

        return to_route('profile.edit');
    }
}
