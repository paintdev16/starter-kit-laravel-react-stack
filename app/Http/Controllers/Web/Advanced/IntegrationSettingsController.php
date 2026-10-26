<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Actions\Advanced\UpdateIntegrationSettings;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApplicationFeatures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class IntegrationSettingsController extends Controller
{
    public function update(Request $request, UpdateIntegrationSettings $updateSettings): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        $validated = $request->validate([
            ApplicationFeatures::REVERB => ['sometimes', 'required', 'boolean'],
            ApplicationFeatures::SANCTUM => ['sometimes', 'required', 'boolean'],
        ]);

        abort_if($validated === [], 422);

        $actor = $request->user();
        abort_unless($actor instanceof User, 401);
        $updateSettings->handle($validated, $actor);

        return back()->with('success', 'Integraciones actualizadas.');
    }
}
