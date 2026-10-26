<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\BackupProblemNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

class BackupProblemNotifier
{
    public function send(string $title, string $message, ?string $url = null): void
    {
        $notification = new BackupProblemNotification($title, $message, $url);

        try {
            $admins = User::role('super-admin')->where('is_active', true)->get();

            if ($admins->isNotEmpty()) {
                $delivered = false;

                foreach ($admins as $admin) {
                    try {
                        $admin->notify($notification);
                        $delivered = true;
                    } catch (Throwable $exception) {
                        Log::warning('No se pudo enviar un aviso de respaldo a un super-admin.', ['user_id' => $admin->getKey(), 'error' => $exception->getMessage()]);
                    }
                }

                if ($delivered) {
                    return;
                }
            }
        } catch (Throwable $exception) {
            Log::warning('No se pudo consultar a los super-admins para avisar del respaldo.', ['error' => $exception->getMessage()]);
        }

        $fallback = config('backup.alert_email');

        if (filled($fallback)) {
            try {
                Notification::route('mail', $fallback)->notify($notification);
            } catch (Throwable $exception) {
                Log::error('No se pudo enviar el aviso de respaldo al correo de emergencia.', ['error' => $exception->getMessage()]);
            }
        }
    }
}
