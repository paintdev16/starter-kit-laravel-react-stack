<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('session_version')->default(0);
        });

        Schema::create('user_invitations', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->index();
            $table->json('role_ids');
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'accepted_at', 'canceled_at']);
        });

        $this->grantLifecyclePermissions();
    }

    public function down(): void
    {
        $this->revokeLifecyclePermissions();
        Schema::dropIfExists('user_invitations');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['is_active']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['is_active', 'session_version']);
        });
    }

    private function grantLifecyclePermissions(): void
    {
        $tables = config('permission.table_names', []);
        $permissionsTable = $tables['permissions'] ?? 'permissions';
        $rolesTable = $tables['roles'] ?? 'roles';
        $roleHasPermissionsTable = $tables['role_has_permissions'] ?? 'role_has_permissions';

        if (! Schema::hasTable($permissionsTable) || ! Schema::hasTable($rolesTable) || ! Schema::hasTable($roleHasPermissionsTable)) {
            return;
        }

        $permissionNames = ['users.invite', 'users.suspend'];
        $now = now();
        DB::table($permissionsTable)->insertOrIgnore([
            [
                'name' => 'users.invite',
                'guard_name' => 'web',
                'label' => 'Invitar usuarios',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'users.suspend',
                'guard_name' => 'web',
                'label' => 'Suspender usuarios y revocar accesos',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $roleIds = DB::table($rolesTable)
            ->where('guard_name', 'web')
            ->whereIn('name', ['administrador', 'super-admin'])
            ->pluck('id');
        $permissionIds = DB::table($permissionsTable)
            ->where('guard_name', 'web')
            ->whereIn('name', $permissionNames)
            ->pluck('id');
        $rolePivotKey = config('permission.column_names.role_pivot_key') ?? 'role_id';
        $permissionPivotKey = config('permission.column_names.permission_pivot_key') ?? 'permission_id';

        foreach ($roleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table($roleHasPermissionsTable)->insertOrIgnore([
                    $rolePivotKey => $roleId,
                    $permissionPivotKey => $permissionId,
                ]);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function revokeLifecyclePermissions(): void
    {
        $tables = config('permission.table_names', []);
        $permissionsTable = $tables['permissions'] ?? 'permissions';
        $roleHasPermissionsTable = $tables['role_has_permissions'] ?? 'role_has_permissions';

        if (! Schema::hasTable($permissionsTable)) {
            return;
        }

        $permissionIds = DB::table($permissionsTable)
            ->where('guard_name', 'web')
            ->whereIn('name', ['users.invite', 'users.suspend'])
            ->pluck('id');

        if (Schema::hasTable($roleHasPermissionsTable)) {
            $permissionPivotKey = config('permission.column_names.permission_pivot_key') ?? 'permission_id';
            DB::table($roleHasPermissionsTable)->whereIn($permissionPivotKey, $permissionIds)->delete();
        }

        DB::table($permissionsTable)->whereIn('id', $permissionIds)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
