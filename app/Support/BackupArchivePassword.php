<?php

namespace App\Support;

use App\Models\ApplicationSetting;
use Illuminate\Support\Facades\Crypt;

class BackupArchivePassword
{
    public const SETTING = 'backup_archive_password';

    public function apply(): void
    {
        $encrypted = ApplicationSetting::query()->whereKey(self::SETTING)->value('value');

        if (is_string($encrypted) && $encrypted !== '') {
            config(['backup.backup.password' => Crypt::decryptString($encrypted)]);
        }
    }

    public function store(string $password): void
    {
        ApplicationSetting::query()->updateOrCreate(
            ['key' => self::SETTING],
            ['value' => Crypt::encryptString($password)],
        );

        config(['backup.backup.password' => $password]);
    }
}
