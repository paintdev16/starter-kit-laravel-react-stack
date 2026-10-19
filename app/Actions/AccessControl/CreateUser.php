<?php

namespace App\Actions\AccessControl;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Spatie\Permission\Models\Role;

class CreateUser
{
    public function __construct(private readonly StoreUserAvatars $storeUserAvatars) {}

    /** @param array{name: string, email: string, password: string, roles?: array<int, int>, avatars?: list<UploadedFile>} $data */
    public function handle(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'email_verified_at' => now(),
            ]);

            $roles = Role::query()
                ->whereKey($data['roles'] ?? [])
                ->where('guard_name', 'web')
                ->where('name', '!=', 'super-admin')
                ->get();
            $user->syncRoles($roles);
            AuditLog::query()->create([
                'actor_id' => Auth::id(), 'event' => 'roles_synced', 'auditable_type' => $user::class,
                'auditable_id' => (string) $user->getKey(), 'auditable_label' => $user->name,
                'changes' => ['roles' => $roles->pluck('name')->values()->all()], 'ip_address' => Request::ip(),
            ]);
            $this->storeUserAvatars->handle($user, $data['avatars'] ?? []);

            return $user;
        });
    }
}
