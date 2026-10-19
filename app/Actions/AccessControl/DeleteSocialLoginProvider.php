<?php

namespace App\Actions\AccessControl;

use App\Models\SocialLoginProvider;

class DeleteSocialLoginProvider
{
    public function handle(string $provider): void
    {
        SocialLoginProvider::query()->where('provider', $provider)->firstOrFail()->delete();
    }
}
