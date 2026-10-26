<?php

namespace App\Notifications;

use App\Models\UserInvitation;
use App\Support\MailBranding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $invitationUrl)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(UserInvitation $notifiable): MailMessage
    {
        return app(MailBranding::class)->message(
            'Tu invitación al equipo',
            'emails.auth.invitation', [
                'name' => $notifiable->name,
                'email' => $notifiable->email,
                'expiresAt' => $notifiable->expires_at,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
