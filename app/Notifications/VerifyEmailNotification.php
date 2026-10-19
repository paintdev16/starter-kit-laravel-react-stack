<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Confirma tu correo electrónico')
            ->theme('paint')
            ->markdown('emails.auth.verify-email', [
                'name' => $notifiable->name,
                'email' => $notifiable->getEmailForVerification(),
                'verificationUrl' => $verificationUrl,
                'expiresIn' => config('auth.verification.expire', 60),
            ]);
    }
}
