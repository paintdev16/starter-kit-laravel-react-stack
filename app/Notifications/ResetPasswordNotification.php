<?php

namespace App\Notifications;

use App\Support\MailBranding;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        return app(MailBranding::class)->message(
            'Restablece tu contraseña',
            'emails.auth.password-reset', [
                'name' => $notifiable->name,
                'resetUrl' => $this->resetUrl($notifiable),
                'expiresIn' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
            ],
        );
    }
}
