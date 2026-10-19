<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\UserLoggedInNotification;
use Illuminate\Auth\Events\Login;
use Throwable;

class NotifySuperAdminsOfLogin
{
    public function handle(Login $event): void
    {
        if ($event->guard !== 'web' || ! $event->user instanceof User) {
            return;
        }

        try {
            $notification = new UserLoggedInNotification(
                $event->user->id,
                $event->user->name,
                $event->user->email,
                request()->ip(),
            );

            User::role('super-admin')->chunkById(100, function ($admins) use ($notification): void {
                foreach ($admins as $admin) {
                    try {
                        $admin->notify($notification);
                    } catch (Throwable $exception) {
                        report($exception);
                    }
                }
            });
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
