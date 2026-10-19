<?php

namespace App\Http\Controllers\Web\Auth;

use App\Actions\Auth\AuthenticateSocialUser;
use App\Http\Controllers\Controller;
use App\Models\SocialLoginProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class SocialLoginController extends Controller
{
    public function redirect(string $provider): RedirectResponse
    {
        $setting = SocialLoginProvider::query()->where('provider', $provider)->firstOrFail();
        abort_unless($setting->enabled && $setting->isConfigured(), 404);
        $setting->configureSocialite();

        return Socialite::driver($provider)->redirect();
    }

    public function callback(
        Request $request,
        string $provider,
        AuthenticateSocialUser $authenticateSocialUser,
    ): RedirectResponse {
        $setting = SocialLoginProvider::query()->where('provider', $provider)->firstOrFail();

        if (! $setting->enabled || ! $setting->isConfigured()) {
            return to_route('login')->withErrors([
                'social' => 'Este método de inicio de sesión está desactivado.',
            ]);
        }

        $setting->configureSocialite();

        try {
            $socialUser = Socialite::driver($provider)->user();
            $user = $authenticateSocialUser->handle($provider, $socialUser);
        } catch (ValidationException $exception) {
            return to_route('login')->withErrors($exception->errors());
        } catch (Throwable $exception) {
            report($exception);

            return to_route('login')->withErrors([
                'social' => 'No se pudo completar el inicio de sesión. Inténtalo nuevamente.',
            ]);
        }

        $request->session()->regenerate();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => true,
            ]);

            return to_route('two-factor.login');
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }
}
