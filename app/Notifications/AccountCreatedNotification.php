<?php

namespace App\Notifications;

use App\Support\ApplicationFeatures;
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

    public function toDatabase(object $notifiable): array
    {
        return ['title' => 'Cuenta creada', 'message' => 'Tu cuenta ya está lista. Inicia sesión para comenzar.', 'url' => route('login')];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Tu cuenta está lista')
            ->greeting('Hola '.$notifiable->name)
            ->line('Se creó tu cuenta. Ya puedes iniciar sesión.')
            ->action('Iniciar sesión', route('login'));
    }
}
