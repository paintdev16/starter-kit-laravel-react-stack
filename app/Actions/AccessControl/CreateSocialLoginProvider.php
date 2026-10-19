<?php

namespace App\Actions\AccessControl;

use App\Models\SocialLoginProvider;

class CreateSocialLoginProvider
{
    /** @param array{provider: string, client_id: string, client_secret: string} $attributes */
    public function handle(array $attributes): SocialLoginProvider
    {
        return SocialLoginProvider::query()->create([
            ...$attributes,
            'enabled' => false,
        ]);
    }
}
