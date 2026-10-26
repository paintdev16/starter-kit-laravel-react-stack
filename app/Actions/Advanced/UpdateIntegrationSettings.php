<?php

namespace App\Actions\Advanced;

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Notifications\ReverbStatusChangedNotification;
use App\Support\ApplicationFeatures;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Throwable;

class UpdateIntegrationSettings
{
    /** @param array<string, bool|int|string> $settings */
    public function handle(array $settings, User $actor): void
    {
        $change = DB::transaction(function () use ($settings, $actor): ?ReverbStatusChangedNotification {
            $revision = null;
            $previousReverbState = null;

            if (array_key_exists(ApplicationFeatures::REVERB, $settings)) {
                ApplicationSetting::query()->firstOrCreate(
                    ['key' => ApplicationFeatures::REVERB_REVISION],
                    ['value' => '0'],
                );
                $revision = ApplicationSetting::query()
                    ->whereKey(ApplicationFeatures::REVERB_REVISION)
                    ->lockForUpdate()
                    ->firstOrFail();
                $previousReverbState = ApplicationSetting::query()
                    ->whereKey(ApplicationFeatures::REVERB)
                    ->lockForUpdate()
                    ->value('value') !== '0';
            }

            foreach ($settings as $key => $enabled) {
                ApplicationSetting::query()->updateOrCreate(
                    ['key' => $key],
                    ['value' => $enabled ? '1' : '0'],
                );
            }

            if ($revision === null || $previousReverbState === (bool) $settings[ApplicationFeatures::REVERB]) {
                return null;
            }

            $nextRevision = (int) $revision->value + 1;
            $revision->update(['value' => (string) $nextRevision]);
            $notification = new ReverbStatusChangedNotification(
                (bool) $settings[ApplicationFeatures::REVERB],
                $actor->id,
                $nextRevision,
            );

            User::query()->select('id')->chunkById(100, function ($users) use ($notification): void {
                Notification::sendNow($users, $notification, ['database']);
            });

            return $notification;
        });

        if ($change === null || ! $change->enabled) {
            return;
        }

        // The history is committed before contacting the real-time server.
        try {
            $items = DatabaseNotification::query()
                ->where('type', ReverbStatusChangedNotification::class)
                ->where('notifiable_type', (new User)->getMorphClass())
                ->where('data->revision', $change->revision)
                ->with('notifiable')
                ->lazyById(100);

            foreach ($items as $item) {
                if (! $item->notifiable instanceof User) {
                    continue;
                }

                $broadcast = clone $change;
                $broadcast->id = $item->id;
                Notification::sendNow($item->notifiable, $broadcast, ['broadcast']);
            }
        } catch (Throwable $exception) {
            // Clients can also receive this saved notice through the status endpoint.
            report($exception);
        }
    }
}
