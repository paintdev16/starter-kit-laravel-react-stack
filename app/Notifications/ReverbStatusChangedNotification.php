<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ReverbStatusChangedNotification extends Notification
{
    public function __construct(
        public readonly bool $enabled,
        public readonly int $actorId,
        public readonly int $revision,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array{title: string, message: string, enabled: bool, revision: int} */
    public function toDatabase(object $notifiable): array
    {
        $isActor = $notifiable instanceof User && $notifiable->getKey() === $this->actorId;
        $message = $this->enabled
            ? ($isActor ? 'Activaste' : 'Se activó').' Laravel Reverb. Las notificaciones en tiempo real están disponibles.'
            : ($isActor ? 'Desactivaste' : 'Se desactivó').' Laravel Reverb. Las notificaciones seguirán guardadas en tu historial.';

        return [
            'title' => $this->enabled ? 'Laravel Reverb activado' : 'Laravel Reverb desactivado',
            'message' => $message,
            'enabled' => $this->enabled,
            'revision' => $this->revision,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return (new BroadcastMessage($this->toDatabase($notifiable)))->onConnection('sync');
    }
}
