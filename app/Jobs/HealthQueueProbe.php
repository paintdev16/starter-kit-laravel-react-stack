<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class HealthQueueProbe implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $id) {}

    public function handle(): void
    {
        $probe = Cache::get('health:queue-probe');

        if (is_array($probe) && ($probe['id'] ?? null) === $this->id) {
            Cache::put('health:queue-probe', [
                'id' => $this->id,
                'queued_at' => $probe['queued_at'],
                'completed_at' => now()->toIso8601String(),
            ], now()->addMinutes(5));
        }
    }
}
