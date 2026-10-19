<?php

namespace App\Actions\AccessControl;

use App\Models\SocialLoginProvider;
use Illuminate\Validation\ValidationException;

class UpdateSocialLoginProvider
{
    /** @param array{enabled?: bool, client_id?: string, client_secret?: string|null} $attributes */
    public function handle(string $provider, array $attributes): SocialLoginProvider
    {
        $setting = SocialLoginProvider::query()->where('provider', $provider)->firstOrFail();

        if (array_key_exists('client_secret', $attributes) && blank($attributes['client_secret'])) {
            unset($attributes['client_secret']);
        }

        $setting->fill($attributes);

        if (($attributes['enabled'] ?? $setting->enabled) && ! $setting->isConfigured()) {
            throw ValidationException::withMessages([
                'provider' => 'Agrega un Client ID y un Client Secret válidos antes de activar este proveedor.',
            ]);
        }

        $setting->save();

        return $setting;
    }
}
