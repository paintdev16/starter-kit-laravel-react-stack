<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Http\Controllers\Controller;
use App\Notifications\ReverbStatusChangedNotification;
use App\Support\ApplicationFeatures;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function latest(Request $request): RedirectResponse
    {
        $notificationId = $request->user()->notifications()->latest()->value('id');

        return $notificationId
            ? redirect()->route('notifications.show', $notificationId)
            : redirect()->route('dashboard');
    }

    public function feed(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->latest()->simplePaginate(20)
            ->through(fn (DatabaseNotification $notification): array => $this->notificationData($notification));

        return response()->json($notifications);
    }

    public function runtime(Request $request, ApplicationFeatures $features): JsonResponse
    {
        $validated = $request->validate(['after' => ['sometimes', 'integer', 'min:0']]);
        $after = (int) ($validated['after'] ?? 0);
        $items = $request->user()->notifications()
            ->where('type', ReverbStatusChangedNotification::class)
            ->where('data->revision', '>', $after)
            ->orderBy('data->revision')
            ->limit(50)
            ->get();

        return response()->json([
            ...$features->reverbState(),
            'cursor' => (int) ($items->last()?->data['revision'] ?? $after),
            'notifications' => $items->map(fn (DatabaseNotification $item): array => [
                ...$item->data,
                'id' => $item->id,
                'type' => $item->type,
            ])->values(),
        ])->header('Cache-Control', 'no-store');
    }

    public function show(Request $request, string $notification): Response
    {
        $item = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        if ($item->unread()) {
            $item->markAsRead();
        }

        return Inertia::render('notifications/show', [
            'notification' => $this->notificationData($item),
        ]);
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    private function notificationData(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'data' => $notification->data,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at->toISOString(),
        ];
    }
}
