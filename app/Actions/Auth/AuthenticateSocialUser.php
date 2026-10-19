<?php

namespace App\Actions\Auth;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Two\User as SocialiteUser;
use Spatie\Permission\Models\Role;

class AuthenticateSocialUser
{
    public function handle(string $provider, SocialiteUser $socialUser): User
    {
        $providerUserId = (string) $socialUser->getId();
        $email = Str::lower(trim((string) $socialUser->getEmail()));
        $raw = $socialUser->getRaw();
        $emailVerified = $provider === 'github'
            ? $email !== ''
            : ($provider === 'google' && (bool) ($raw['email_verified'] ?? false));

        if ($providerUserId === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL) || ! $emailVerified) {
            throw ValidationException::withMessages([
                'social' => 'El proveedor no devolvió un correo verificado. Verifica tu correo y vuelve a intentarlo.',
            ]);
        }

        return DB::transaction(function () use ($provider, $providerUserId, $email, $socialUser): User {
            $account = SocialAccount::query()
                ->where('provider', $provider)
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($account !== null) {
                return $account->user()->firstOrFail();
            }

            $user = User::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->lockForUpdate()
                ->first();

            if ($user === null) {
                $name = trim((string) ($socialUser->getName() ?: $socialUser->getNickname() ?: Str::before($email, '@')));

                $user = User::query()->create([
                    'name' => Str::limit($name !== '' ? $name : 'Usuario', 255, ''),
                    'email' => $email,
                    'password' => Str::random(64),
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();

                $user->assignRole(Role::findOrCreate('usuario', 'web'));
            } elseif (! $user->hasVerifiedEmail()) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            $user->socialAccounts()->create([
                'provider' => $provider,
                'provider_user_id' => $providerUserId,
            ]);

            return $user;
        });
    }
}
