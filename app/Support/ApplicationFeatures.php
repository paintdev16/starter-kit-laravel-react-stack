<?php

namespace App\Support;

use App\Models\ApplicationSetting;

class ApplicationFeatures
{
    public const REVERB = 'reverb_enabled';

    public const REVERB_REVISION = 'reverb_revision';

    public const SANCTUM = 'sanctum_enabled';

    public const BACKUPS = 'backups_enabled';

    public function reverbEnabled(): bool
    {
        return $this->enabled(self::REVERB);
    }

    public function sanctumEnabled(): bool
    {
        return $this->enabled(self::SANCTUM);
    }

    public function backupsEnabled(): bool
    {
        return $this->enabled(self::BACKUPS);
    }

    /** @return array{reverbEnabled: bool, reverbRevision: int} */
    public function reverbState(): array
    {
        $settings = ApplicationSetting::query()
            ->whereIn('key', [self::REVERB, self::REVERB_REVISION])
            ->pluck('value', 'key');

        return [
            'reverbEnabled' => $settings->get(self::REVERB) !== '0',
            'reverbRevision' => (int) $settings->get(self::REVERB_REVISION, '0'),
        ];
    }

    private function enabled(string $key): bool
    {
        return ApplicationSetting::query()->whereKey($key)->value('value') !== '0';
    }
}
