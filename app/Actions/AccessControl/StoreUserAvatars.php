<?php

namespace App\Actions\AccessControl;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class StoreUserAvatars
{
    /** @param list<UploadedFile> $files */
    public function handle(User $user, array $files): void
    {
        $storedPaths = [];

        try {
            foreach ($files as $file) {
                $path = $file->storePublicly("avatars/{$user->getKey()}", 'public');

                if ($path === false) {
                    throw new RuntimeException('No se pudo guardar la imagen del avatar.');
                }

                $storedPaths[] = $path;
                $user->avatars()->create([
                    'disk' => 'public',
                    'path' => $path,
                ]);
            }
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }
    }
}
