<?php

namespace App\Observers;

use App\Models\ApplicationSetting;
use App\Models\AuditLog;
use App\Support\BackupArchivePassword;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditObserver
{
    public function created(Model $model): void
    {
        $this->record($model, 'created', $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $this->record($model, 'updated', $model->getChanges());
    }

    public function deleted(Model $model): void
    {
        $this->record($model, 'deleted', []);
    }

    private function record(Model $model, string $event, array $changes): void
    {
        if ($model instanceof ApplicationSetting && $model->getKey() === BackupArchivePassword::SETTING) {
            $changes = [];
        }

        $changes = collect($changes)
            ->except(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'])
            ->all();

        AuditLog::query()->create([
            'actor_id' => Auth::id(),
            'event' => $event,
            'auditable_type' => $model::class,
            'auditable_id' => (string) $model->getKey(),
            'auditable_label' => $model->getAttribute('name') ?? $model->getAttribute('email') ?? class_basename($model),
            'changes' => $changes === [] ? null : $changes,
            'ip_address' => Request::ip(),
        ]);
    }
}
