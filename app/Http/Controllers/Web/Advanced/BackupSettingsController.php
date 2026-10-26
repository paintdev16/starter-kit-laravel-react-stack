<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Http\Controllers\Controller;
use App\Jobs\PrepareBackupRestore;
use App\Models\ApplicationSetting;
use App\Support\ApplicationFeatures;
use App\Support\BackupArchivePassword;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Backup\BackupDestination\BackupDestination;
use Throwable;

class BackupSettingsController extends Controller
{
    public function updatePassword(Request $request, BackupArchivePassword $backupPassword): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:16', 'max:1024', 'confirmed'],
        ]);

        $backupPassword->store($validated['password']);

        return back()->with('success', 'Contraseña de los próximos respaldos actualizada.');
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        $validated = $request->validate(['enabled' => ['required', 'boolean']]);

        ApplicationSetting::query()->updateOrCreate(
            ['key' => ApplicationFeatures::BACKUPS],
            ['value' => $validated['enabled'] ? '1' : '0'],
        );

        return back()->with('success', $validated['enabled'] ? 'Respaldos automáticos activados.' : 'Respaldos automáticos desactivados.');
    }

    public function restore(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        $validated = $request->validate([
            'archive' => ['required', 'string', 'regex:/\A[A-Za-z0-9_.-]+\.zip\z/iD'],
            'confirmation' => ['accepted'],
            'password' => ['nullable', 'string', 'max:1024'],
        ]);

        $disk = (string) config('backup.backup.destination.disks.0');
        $destination = BackupDestination::create($disk, (string) config('backup.backup.name'));
        $path = $destination->backupName().'/'.$validated['archive'];

        if (! $destination->isReachable() || ! $destination->disk()->exists($path)) {
            return back()->withErrors(['archive' => 'El respaldo ya no está disponible.']);
        }

        if (DB::table('backup_restore_runs')->whereIn('status', ['pending', 'running'])->exists()) {
            return back()->withErrors(['archive' => 'Ya hay una restauración en curso.']);
        }

        $id = (string) Str::uuid();
        DB::table('backup_restore_runs')->insert([
            'id' => $id,
            'requested_by' => $request->user()->id,
            'disk' => $disk,
            'archive' => $validated['archive'],
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            PrepareBackupRestore::dispatch($id, $disk, $validated['archive'], $validated['password'] ?? null);
        } catch (Throwable $exception) {
            DB::table('backup_restore_runs')->where('id', $id)->update([
                'status' => 'failed',
                'error' => 'No se pudo enviar la restauración a la cola.',
                'finished_at' => now(),
                'updated_at' => now(),
            ]);

            report($exception);

            return back()->withErrors(['archive' => 'No se pudo iniciar la restauración.']);
        }

        return back()->with('success', 'Restauración enviada a la cola. La instalación activa no se modificará.');
    }
}
