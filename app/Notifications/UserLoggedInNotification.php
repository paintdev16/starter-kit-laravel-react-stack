<?php

namespace App\Notifications;

use App\Support\ApplicationFeatures;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class UserLoggedInNotification extends Notification
{
    public function __construct(
        public readonly int $userId,
        public readonly string $userName,
        public readonly string $userEmail,
        public readonly ?string $ipAddress,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (app(ApplicationFeatures::class)->reverbEnabled()) {
            $channels[] = 'broadcast';
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Nuevo inicio de sesión',
            'message' => $this->userName.' ('.$this->userEmail.') inició sesión'.($this->ipAddress ? ' desde '.$this->ipAddress : '').'.',
            'url' => route('access-control.index'),
            'user_id' => $this->userId,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
