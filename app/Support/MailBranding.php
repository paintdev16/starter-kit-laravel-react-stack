<?php

namespace App\Support;

use App\Models\ApplicationSetting;
use Illuminate\Notifications\Messages\MailMessage;

class MailBranding
{
    /** @return array{name: string, initial: string, url: string, supportEmail: ?string, timezone: string, year: string} */
    public function data(): array
    {
        $settings = ApplicationSetting::query()
            ->whereIn('key', ['app_name', 'support_email', 'timezone'])
            ->pluck('value', 'key');
        $name = trim((string) ($settings->get('app_name') ?: config('app.name')));
        $timezone = $settings->get('timezone') ?: config('app.timezone', 'UTC');
        $supportEmail = $settings->get('support_email');

        return [
            'name' => $name,
            'initial' => mb_strtoupper(mb_substr($name, 0, 1)),
            'url' => config('app.url'),
            'supportEmail' => filter_var($supportEmail, FILTER_VALIDATE_EMAIL) ? $supportEmail : null,
            'timezone' => $timezone,
            'year' => now()->timezone($timezone)->format('Y'),
        ];
    }

    /** @param array<string, mixed> $data */
    public function message(string $subject, string $view, array $data = []): MailMessage
    {
        $brand = $this->data();

        return (new MailMessage)
            ->subject($subject.' · '.$brand['name'])
            ->from(config('mail.from.address'), $brand['name'])
            ->theme('paint')
            ->markdown($view, [...$data, 'brand' => $brand]);
    }
}
