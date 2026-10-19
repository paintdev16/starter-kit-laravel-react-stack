<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Http\Controllers\Controller;
use App\Models\ManagedFile;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Request as RequestFacade;
use Inertia\Inertia;
use Inertia\Response;

class ManagedFileController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('advanced/files', [
            'maxUploadKilobytes' => $this->maxUploadKilobytes(),
            'files' => ManagedFile::query()->with('user:id,name')->latest()->paginate(20)->through(fn (ManagedFile $file): array => [
                'id' => $file->id, 'name' => $file->original_name, 'mime_type' => $file->mime_type,
                'size' => $file->size, 'owner' => $file->user->name, 'created_at' => $file->created_at->toISOString(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['file' => [
            'required', 'file', 'max:'.$this->maxUploadKilobytes(),
            'mimes:pdf,csv,txt,jpg,jpeg,png,webp,doc,docx,xls,xlsx',
        ]]);
        $uploaded = $request->file('file');
        $path = $uploaded->store('managed-files', 'local');

        $managedFile = ManagedFile::query()->create([
            'user_id' => $request->user()->id, 'disk' => 'local', 'path' => $path,
            'original_name' => $uploaded->getClientOriginalName(), 'mime_type' => $uploaded->getMimeType(), 'size' => $uploaded->getSize(),
        ]);
        AuditLog::query()->create([
            'actor_id' => $request->user()->id, 'event' => 'file_uploaded', 'auditable_type' => ManagedFile::class,
            'auditable_id' => (string) $managedFile->id, 'auditable_label' => $managedFile->original_name,
            'changes' => ['size' => $managedFile->size, 'mime_type' => $managedFile->mime_type], 'ip_address' => RequestFacade::ip(),
        ]);

        return back()->with('success', 'Archivo cargado correctamente.');
    }

    public function download(ManagedFile $file)
    {
        abort_unless($file->user_id === request()->user()->id || request()->user()->hasRole('super-admin'), 403);

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }

    public function preview(ManagedFile $file)
    {
        abort_unless($file->user_id === request()->user()->id || request()->user()->hasRole('super-admin'), 403);
        abort_unless(in_array($file->mime_type, [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
        ], true), 415);

        return Storage::disk($file->disk)->response($file->path, $file->original_name, [
            'Content-Type' => $file->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ], 'inline');
    }

    public function destroy(ManagedFile $file): RedirectResponse
    {
        abort_unless($file->user_id === request()->user()->id || request()->user()->hasRole('super-admin'), 403);
        Storage::disk($file->disk)->delete($file->path);
        AuditLog::query()->create([
            'actor_id' => request()->user()->id, 'event' => 'file_deleted', 'auditable_type' => ManagedFile::class,
            'auditable_id' => (string) $file->id, 'auditable_label' => $file->original_name,
            'ip_address' => RequestFacade::ip(),
        ]);
        $file->delete();

        return back()->with('success', 'Archivo eliminado.');
    }

    private function maxUploadKilobytes(): int
    {
        $limits = array_filter([
            $this->iniSizeInKilobytes((string) ini_get('upload_max_filesize')),
            $this->iniSizeInKilobytes((string) ini_get('post_max_size')),
            20 * 1024,
        ], fn (int $limit): bool => $limit > 0);

        return min($limits);
    }

    private function iniSizeInKilobytes(string $value): int
    {
        $value = trim($value);
        $unit = strtolower(substr($value, -1));
        $size = (float) $value;
        $bytes = match ($unit) {
            'g' => $size * 1024 * 1024 * 1024,
            'm' => $size * 1024 * 1024,
            'k' => $size * 1024,
            default => $size,
        };

        return (int) floor($bytes / 1024);
    }
}
