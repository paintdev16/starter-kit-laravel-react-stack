<?php

namespace App\Support;

use App\Models\ApplicationSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ApplicationInstallation
{
    public const KEY = 'installation';

    /** @return array{token_hash?: string, expires_at?: int, completed_at?: string} */
    public function state(): array
    {
        $value = ApplicationSetting::query()->whereKey(self::KEY)->value('value');

        return $value === null ? [] : json_decode($value, true, flags: JSON_THROW_ON_ERROR);
    }

    public function pending(): bool
    {
        $state = $this->state();

        return isset($state['token_hash']) && ! isset($state['completed_at']);
    }

    public function completed(): bool
    {
        return isset($this->state()['completed_at']) || User::query()->exists();
    }

    public function available(): bool
    {
        $state = $this->state();

        return isset($state['token_hash'])
            && ! isset($state['completed_at'])
            && ($state['expires_at'] ?? 0) > now()->getTimestamp()
            && ! User::query()->exists();
    }

    public function prepare(): string
    {
        return DB::transaction(function (): string {
            if ($this->completed()) {
                throw new RuntimeException('La aplicación ya está instalada o tiene usuarios. No se puede abrir la instalación inicial.');
            }

            ApplicationSetting::query()->firstOrCreate(['key' => self::KEY], ['value' => '{}']);
            $setting = ApplicationSetting::query()->whereKey(self::KEY)->lockForUpdate()->firstOrFail();

            // Recheck under the same lock used when completing the installation.
            $state = json_decode($setting->value, true, flags: JSON_THROW_ON_ERROR);
            if (isset($state['completed_at']) || User::query()->lockForUpdate()->first(['id']) !== null) {
                throw new RuntimeException('La aplicación ya está instalada o tiene usuarios.');
            }

            $token = Str::random(64);
            $setting->update(['value' => json_encode([
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addHour()->getTimestamp(),
            ], JSON_THROW_ON_ERROR)]);

            return $token;
        });
    }
}
