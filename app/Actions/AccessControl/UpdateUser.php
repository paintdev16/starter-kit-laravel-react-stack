<?php

namespace App\Actions\AccessControl;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UpdateUser
{
    public function __construct(private readonly StoreUserAvatars $storeUserAvatars) {}

    /** @param array{name: string, email: string, password?: string|null, roles?: array<int, int>, avatars?: list<UploadedFile>} $data */
    public function handle(User $user, array $data): User
    {
        $this->ensureEditable($user);

        return DB::transaction(function () use ($user, $data): User {
            $previousRoles = $user->getRoleNames()->values()->all();
            $attributes = [
                'name' => $data['name'],
                'email' => $data['email'],
            ];

            if (filled($data['password'] ?? null)) {
                $attributes['password'] = $data['password'];
            }

            $user->update($attributes);

            $roles = Role::query()
                ->whereKey($data['roles'] ?? [])
                ->where('guard_name', 'web')
                ->where('name', '!=', 'super-admin')
                ->get();
            $user->syncRoles($roles);
            AuditLog::query()->create([
                'actor_id' => request()->user()?->id, 'event' => 'roles_synced', 'auditable_type' => $user::class,
                'auditable_id' => (string) $user->getKey(), 'auditable_label' => $user->name,
                'changes' => ['from' => $previousRoles, 'to' => $roles->pluck('name')->values()->all()], 'ip_address' => Request::ip(),
            ]);
            $user->syncPermissions([]);
            $this->storeUserAvatars->handle($user, $data['avatars'] ?? []);

            return $user;
        });
    }

    private function ensureEditable(User $user): void
    {
        if ($user->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'user' => 'La cuenta super-admin está protegida.',
            ]);
        }
    }
}
