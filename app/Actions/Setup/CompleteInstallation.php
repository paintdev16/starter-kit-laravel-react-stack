<?php

namespace App\Actions\Setup;

use App\Actions\AccessControl\InitializeAccessControl;
use App\Models\ApplicationSetting;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\ApplicationInstallation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;

class CompleteInstallation
{
    public function __construct(private readonly InitializeAccessControl $initializeAccessControl) {}

    /** @param array{setup_token: string, name: string, email: string, password: string, app_name: string, support_email?: ?string, timezone: string} $data */
    public function handle(array $data): void
    {
        DB::transaction(function () use ($data): void {
            $setting = ApplicationSetting::query()
                ->whereKey(ApplicationInstallation::KEY)
                ->lockForUpdate()
                ->first();
            $state = json_decode($setting?->value ?? '{}', true, flags: JSON_THROW_ON_ERROR);

            abort_if(isset($state['completed_at']) || User::query()->exists(), 409, 'La instalación ya fue completada o existen usuarios.');

            if ($setting === null || ! isset($state['token_hash'])
                || ($state['expires_at'] ?? 0) <= now()->getTimestamp()
                || ! hash_equals($state['token_hash'], hash('sha256', $data['setup_token']))) {
                throw ValidationException::withMessages([
                    'setup_token' => 'El código es incorrecto o venció. Ejecuta app:install en el servidor para generar uno nuevo.',
                ]);
            }

            $this->initializeAccessControl->handle();
            $admin = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            // The first account is provisioned by an operator holding the server-generated code.
            $admin->forceFill(['email_verified_at' => now(), 'is_active' => true])->save();
            $admin->assignRole('super-admin');

            foreach (['app_name', 'support_email', 'timezone'] as $key) {
                ApplicationSetting::query()->updateOrCreate(['key' => $key], ['value' => $data[$key] ?? null]);
            }

            $setting->update(['value' => json_encode([
                'completed_at' => now()->toISOString(),
            ], JSON_THROW_ON_ERROR)]);

            AuditLog::query()->create([
                'actor_id' => $admin->id,
                'event' => 'application_installed',
                'auditable_type' => User::class,
                'auditable_id' => (string) $admin->id,
                'auditable_label' => $data['app_name'],
                'changes' => ['app_name' => $data['app_name'], 'timezone' => $data['timezone']],
                'ip_address' => Request::ip(),
            ]);
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
