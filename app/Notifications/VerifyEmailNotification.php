<?php

namespace App\Notifications;

use App\Support\MailBranding;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return app(MailBranding::class)->message(
            'Confirma tu correo electrónico',
            'emails.auth.verify-email', [
                'name' => $notifiable->name,
                'email' => $notifiable->getEmailForVerification(),
                'verificationUrl' => $verificationUrl,
                'expiresIn' => config('auth.verification.expire', 60),
            ],
        );
    }
}
