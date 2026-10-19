<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\GetSocialLoginProviders;
use App\Actions\AccessControl\CreateSocialLoginProvider;
use App\Actions\AccessControl\DeleteSocialLoginProvider;
use App\Actions\AccessControl\UpdateSocialLoginProvider;
use App\Http\Controllers\Controller;
use App\Models\SocialLoginProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SocialLoginSettingsController extends Controller
{
    public function index(GetSocialLoginProviders $getSocialLoginProviders): Response
    {
        Gate::authorize('social-login.manage');

        return Inertia::render('access-control/social-login', [
            ...$getSocialLoginProviders->handle(),
        ]);
    }

    public function store(Request $request, CreateSocialLoginProvider $createSocialLoginProvider): RedirectResponse
    {
        Gate::authorize('social-login.manage');

        $validated = $request->validate([
            'provider' => ['required', 'string', 'in:'.implode(',', array_keys(SocialLoginProvider::SUPPORTED_PROVIDERS)), 'unique:social_login_providers,provider'],
            'client_id' => ['required', 'string', 'max:255'],
            'client_secret' => ['required', 'string', 'max:4096'],
        ]);

        $createSocialLoginProvider->handle($validated);

        return back()->with('success', 'Proveedor agregado. Ya puedes activarlo cuando quieras.');
    }

    public function update(
        Request $request,
        string $provider,
        UpdateSocialLoginProvider $updateSocialLoginProvider,
    ): RedirectResponse {
        Gate::authorize('social-login.manage');

        $validated = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'client_id' => ['sometimes', 'required', 'string', 'max:255'],
            'client_secret' => ['sometimes', 'nullable', 'string', 'max:4096'],
        ]);

        $updateSocialLoginProvider->handle($provider, $validated);

        return back()->with('success', array_key_exists('enabled', $validated)
            ? ($validated['enabled'] ? 'Inicio de sesión social activado.' : 'Inicio de sesión social desactivado.')
            : 'Credenciales actualizadas.');
    }

    public function destroy(string $provider, DeleteSocialLoginProvider $deleteSocialLoginProvider): RedirectResponse
    {
        Gate::authorize('social-login.manage');

        $deleteSocialLoginProvider->handle($provider);

        return back()->with('success', 'Proveedor eliminado.');
    }
}
