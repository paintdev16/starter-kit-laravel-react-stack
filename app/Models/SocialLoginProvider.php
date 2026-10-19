<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['provider', 'enabled', 'client_id', 'client_secret'])]
class SocialLoginProvider extends Model
{
    public const SUPPORTED_PROVIDERS = [
        'github' => 'GitHub',
        'google' => 'Google',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'client_secret' => 'encrypted',
        ];
    }

    public function isConfigured(): bool
    {
        $service = config("services.{$this->provider}", []);
        $clientId = $this->client_id ?: ($service['client_id'] ?? null);
        $clientSecret = $this->client_secret ?: ($service['client_secret'] ?? null);

        return filled($clientId)
            && filled($clientSecret)
            && filled($service['redirect'] ?? null);
    }

    public function configureSocialite(): void
    {
        $service = config("services.{$this->provider}", []);

        config([
            "services.{$this->provider}" => array_merge($service, [
                'client_id' => $this->client_id ?: ($service['client_id'] ?? null),
                'client_secret' => $this->client_secret ?: ($service['client_secret'] ?? null),
                'redirect' => route('social-login.callback', $this->provider),
            ]),
        ]);
    }
}
