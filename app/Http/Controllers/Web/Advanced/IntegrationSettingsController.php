<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Http\Controllers\Controller;
use App\Models\ApplicationSetting;
use App\Support\ApplicationFeatures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IntegrationSettingsController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        $validated = $request->validate([
            ApplicationFeatures::REVERB => ['sometimes', 'required', 'boolean'],
            ApplicationFeatures::SANCTUM => ['sometimes', 'required', 'boolean'],
        ]);

        abort_if($validated === [], 422);

        DB::transaction(function () use ($validated): void {
            foreach ($validated as $key => $enabled) {
                ApplicationSetting::query()->updateOrCreate(
                    ['key' => $key],
                    ['value' => $enabled ? '1' : '0'],
                );
            }
        });

        return back()->with('success', 'Integraciones actualizadas.');
    }
}
