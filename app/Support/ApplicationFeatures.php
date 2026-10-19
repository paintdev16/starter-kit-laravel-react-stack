<?php

namespace App\Support;

use App\Models\ApplicationSetting;

class ApplicationFeatures
{
    public const REVERB = 'reverb_enabled';

    public const SANCTUM = 'sanctum_enabled';

    public function reverbEnabled(): bool
    {
        return $this->enabled(self::REVERB);
    }

    public function sanctumEnabled(): bool
    {
        return $this->enabled(self::SANCTUM);
    }

    private function enabled(string $key): bool
    {
        return ApplicationSetting::query()->whereKey($key)->value('value') !== '0';
    }
}
