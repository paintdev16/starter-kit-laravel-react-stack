<?php

namespace App\Actions\Settings;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use stdClass;

class ManageBrowserSessions
{
    public function supported(): bool
    {
        return config('session.driver') === 'database';
    }

    /** @return array<int, array{id: string, browser: string, platform: string, device: string, ip_address: ?string, last_active_at: string, is_current: bool}> */
    public function list(User $user, Request $request): array
    {
        if (! $this->supported()) {
            return [];
        }

        $currentId = $request->session()->getId();
        $sessions = $this->query($user)
            ->where('last_activity', '>=', now()->subMinutes((int) config('session.lifetime', 120))->getTimestamp())
            ->orderByDesc('last_activity')
            ->orderBy('id')
            ->get(['id', 'ip_address', 'user_agent', 'last_activity']);

        // A session is first persisted after its response, so include the current device on its first visit.
        if (! $sessions->contains('id', $currentId)) {
            $sessions->prepend((object) [
                'id' => $currentId,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'last_activity' => now()->getTimestamp(),
            ]);
        }

        return $sessions->map(fn (stdClass $session): array => [
            'id' => $this->publicId($user, $session->id),
            ...$this->device($session->user_agent ?? ''),
            'ip_address' => $session->ip_address,
            'last_active_at' => now()->setTimestamp((int) $session->last_activity)->toISOString(),
            'is_current' => $session->id === $currentId,
        ])->sortByDesc('is_current')->values()->all();
    }

    public function revoke(User $user, Request $request, ?string $sessionId = null): int
    {
        if (! $this->supported()) {
            throw ValidationException::withMessages(['confirmation' => 'La administración de sesiones no está disponible. Contacta con el administrador.']);
        }

        $currentId = $request->session()->getId();
        $target = null;

        if ($sessionId !== null) {
            if (hash_equals($this->publicId($user, $currentId), $sessionId)) {
                throw ValidationException::withMessages(['confirmation' => 'Esta es tu sesión actual. Usa la opción Cerrar sesión del menú de tu cuenta.']);
            }

            $target = $this->query($user)->get(['id', 'ip_address', 'user_agent'])
                ->first(fn (stdClass $session): bool => hash_equals($this->publicId($user, $session->id), $sessionId));
            abort_if($target === null, 404);
        }

        // Invalidate remembered logins before deleting sessions, including with a separate session connection.
        DB::transaction(function () use ($user): void {
            $account = User::query()->lockForUpdate()->findOrFail($user->id);
            $account->forceFill(['remember_token' => Str::random(60)])->saveQuietly();
            $user->setRememberToken($account->getRememberToken());
        });

        return DB::connection(config('session.connection'))->transaction(function () use ($user, $request, $currentId, $target): int {
            $query = $this->query($user)->where('id', '!=', $currentId);

            if ($target !== null) {
                $query->where('id', $target->id);
            }

            $count = $query->delete();

            if ($count > 0) {
                AuditLog::query()->create([
                    'actor_id' => $user->id,
                    'event' => $target === null ? 'browser_sessions_revoked' : 'browser_session_revoked',
                    'auditable_type' => User::class,
                    'auditable_id' => (string) $user->id,
                    'auditable_label' => $user->name,
                    'changes' => array_filter([
                        'sessions_closed' => $count,
                        'device' => $target === null ? null : $this->device($target->user_agent ?? ''),
                        'device_ip' => $target?->ip_address,
                    ], fn ($value): bool => $value !== null),
                    'ip_address' => $request->ip(),
                ]);
            }

            return $count;
        });
    }

    private function query(User $user): Builder
    {
        return DB::connection(config('session.connection'))
            ->table(config('session.table', 'sessions'))
            ->useWritePdo()
            ->where('user_id', $user->id);
    }

    private function publicId(User $user, string $sessionId): string
    {
        // The browser must never receive another device's session cookie identifier.
        return hash_hmac('sha256', $user->id.'|'.$sessionId, config('app.key'));
    }

    /** @return array{browser: string, platform: string, device: string} */
    private function device(string $userAgent): array
    {
        $browser = match (true) {
            preg_match('/Edg|Edge/i', $userAgent) === 1 => 'Microsoft Edge',
            preg_match('/OPR|Opera|OPiOS/i', $userAgent) === 1 => 'Opera',
            str_contains($userAgent, 'SamsungBrowser') => 'Samsung Internet',
            preg_match('/Firefox|FxiOS/i', $userAgent) === 1 => 'Firefox',
            preg_match('/Chrome|CriOS/i', $userAgent) === 1 => 'Chrome',
            str_contains($userAgent, 'Safari') => 'Safari',
            default => 'Navegador no identificado',
        };
        $platform = match (true) {
            preg_match('/iPad|Macintosh(?=.*Mobile)/i', $userAgent) === 1 => 'iPadOS',
            preg_match('/iPhone|iPod/i', $userAgent) === 1 => 'iOS',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'CrOS') => 'ChromeOS',
            str_contains($userAgent, 'Windows') => 'Windows',
            preg_match('/Macintosh|Mac OS/i', $userAgent) === 1 => 'macOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => 'Sistema no identificado',
        };

        return [
            'browser' => $browser,
            'platform' => $platform,
            'device' => match (true) {
                preg_match('/iPad|Tablet|Macintosh(?=.*Mobile)|Android(?!.*Mobile)/i', $userAgent) === 1 => 'tablet',
                preg_match('/Mobile|iPhone|iPod/i', $userAgent) === 1 => 'mobile',
                default => 'desktop',
            },
        ];
    }
}
