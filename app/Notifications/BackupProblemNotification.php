<?php

namespace App\Notifications;

use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BackupProblemNotification extends Notification
{
    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $url = null,
    ) {}

    public function via(object $notifiable): array
    {
        return $notifiable instanceof AnonymousNotifiable ? ['mail'] : ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url ?? route('advanced.health.index'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title.' · '.config('app.name'))
            ->greeting('Atención, superadministrador')
            ->line($this->message)
            ->line('Revisa los registros del servidor y el panel de salud para identificar la causa.')
            ->action('Revisar respaldos', $this->url ?? route('advanced.health.index'));
    }
}
