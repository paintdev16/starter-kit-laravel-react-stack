<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('advanced/audit', [
            'entries' => AuditLog::query()->with('actor:id,name,email')->latest()->paginate(30)->through(fn (AuditLog $log): array => [
                'id' => $log->id,
                'actor' => $log->actor?->name ?? 'Sistema',
                'event' => $log->event,
                'model' => class_basename($log->auditable_type),
                'label' => $log->auditable_label,
                'changes' => $log->changes,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toISOString(),
            ]),
        ]);
    }
}
