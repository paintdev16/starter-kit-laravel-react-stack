<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Actions\AccessControl\GetSocialLoginProviders;
use App\Actions\Advanced\GetBackupSettings;
use App\Http\Controllers\Controller;
use App\Models\ApplicationSetting;
use App\Support\ApplicationFeatures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationSettingsController extends Controller
{
    public function index(Request $request, ApplicationFeatures $features, GetSocialLoginProviders $socialLoginProviders, GetBackupSettings $backupSettings): Response
    {
        $settings = ApplicationSetting::query()->pluck('value', 'key');

        return Inertia::render('advanced/settings', [
            'settings' => [
                'app_name' => $settings['app_name'] ?? config('app.name'),
                'support_email' => $settings['support_email'] ?? '',
                'timezone' => $settings['timezone'] ?? config('app.timezone'),
            ],
            'features' => [
                'reverb_enabled' => $features->reverbEnabled(),
                'sanctum_enabled' => $features->sanctumEnabled(),
            ],
            'social_login' => Gate::allows('social-login.manage')
                ? $socialLoginProviders->handle()
                : null,
            'backup_settings' => $request->user()?->hasRole('super-admin')
                ? fn (): array => $backupSettings->handle()
                : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:100'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'timezone' => ['required', 'timezone'],
        ]);

        foreach ($validated as $key => $value) {
            ApplicationSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return back()->with('success', 'Configuración guardada.');
    }
}
