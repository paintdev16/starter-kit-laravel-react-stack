<?php

namespace App\Notifications;

use App\Support\ApplicationFeatures;
use App\Support\MailBranding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        $channels = ['database', 'mail'];

        if (app(ApplicationFeatures::class)->reverbEnabled()) {
            $channels[] = 'broadcast';
        }

        return $channels;
    }

    public function viaConnections(): array
    {
        return [
            'database' => 'sync',
            'broadcast' => 'sync',
        ];
    }

    public function toDatabase(object $notifiable): array
    {
        return ['title' => 'Cuenta creada', 'message' => 'Tu cuenta ya está lista. Inicia sesión para comenzar.', 'url' => route('login')];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return (new BroadcastMessage($this->toDatabase($notifiable)))
            ->onConnection('sync');
    }

    public function toMail(object $notifiable): MailMessage
    {
        return app(MailBranding::class)->message(
            'Tu cuenta está lista',
            'emails.auth.account-created', [
                'name' => $notifiable->name,
                'email' => $notifiable->email,
                'loginUrl' => route('login'),
            ],
        );
    }
}
