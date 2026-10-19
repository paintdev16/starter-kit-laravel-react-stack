<?php

namespace App\Actions\AccessControl;

use App\Models\SocialLoginProvider;
use Illuminate\Support\Collection;

class GetSocialLoginProviders
{
    /** @return array{providers: Collection<int, array{provider: string, label: string, enabled: bool, configured: bool, has_saved_credentials: bool, client_id: string|null, callback_url: string, client_id_env: string, client_secret_env: string}>, available_providers: array<string, string>} */
    public function handle(): array
    {
        $providers = SocialLoginProvider::query()
            ->orderBy('provider')
            ->get()
            ->map(fn (SocialLoginProvider $provider): array => [
                'provider' => $provider->provider,
                'label' => SocialLoginProvider::SUPPORTED_PROVIDERS[$provider->provider] ?? ucfirst($provider->provider),
                'enabled' => (bool) $provider->enabled,
                'configured' => $provider->isConfigured(),
                'has_saved_credentials' => filled($provider->client_id) && filled($provider->client_secret),
                'client_id' => $provider->client_id,
                'callback_url' => route('social-login.callback', $provider->provider),
                'client_id_env' => strtoupper($provider->provider).'_CLIENT_ID',
                'client_secret_env' => strtoupper($provider->provider).'_CLIENT_SECRET',
            ]);

        $existing = $providers->pluck('provider')->all();

        return [
            'providers' => $providers,
            'available_providers' => array_diff_key(
                SocialLoginProvider::SUPPORTED_PROVIDERS,
                array_flip($existing),
            ),
        ];
    }
}
