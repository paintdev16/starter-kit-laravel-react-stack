<?php

namespace App\Actions\Settings;

use App\Models\AuditLog;
use App\Models\User;
use App\Support\ApplicationFeatures;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class ManageApiTokens
{
    public function __construct(private readonly ApplicationFeatures $features) {}

    /** @return array<int, array{id: int, name: string, abilities: array<string>, created_at: string, last_used_at: ?string, expires_at: ?string, is_expired: bool}> */
    public function list(User $user): array
    {
        return $user->tokens()
            ->orderByDesc('created_at')->orderByDesc('id')
            ->get(['id', 'name', 'abilities', 'created_at', 'last_used_at', 'expires_at'])
            ->map(function (PersonalAccessToken $token): array {
                $expiresAt = $this->effectiveExpiry($token);

                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'abilities' => $token->abilities ?? [],
                    'created_at' => $token->created_at->toISOString(),
                    'last_used_at' => $token->last_used_at?->toISOString(),
                    'expires_at' => $expiresAt?->toISOString(),
                    'is_expired' => $expiresAt !== null && $expiresAt->lessThanOrEqualTo(now()),
                ];
            })->all();
    }

    /**
     * @param  array{name: string, abilities: array<string>, expires_in: int}  $data
     * @return array{id: int, name: string, token: string, expires_at: string, abilities: array<string>}
     */
    public function create(User $user, array $data): array
    {
        return DB::transaction(function () use ($user, $data): array {
            $account = User::query()->lockForUpdate()->findOrFail($user->id);
            abort_unless($account->is_active && $account->hasVerifiedEmail(), 403);

            if (! $this->features->sanctumEnabled()) {
                throw ValidationException::withMessages(['integration' => 'La API está desactivada. No se pueden crear nuevos tokens.']);
            }

            $expiresAt = now()->addDays((int) $data['expires_in']);
            $globalMinutes = (int) config('sanctum.expiration', 0);

            if ($globalMinutes > 0) {
                $expiresAt = $expiresAt->min(now()->addMinutes($globalMinutes));
            }

            $created = $account->createToken($data['name'], $data['abilities'], $expiresAt);
            $this->audit($account, 'api_token_created', $created->accessToken, [
                'abilities' => $data['abilities'],
                'expires_at' => $expiresAt->toISOString(),
            ]);

            return [
                'id' => $created->accessToken->id,
                'name' => $created->accessToken->name,
                'token' => $created->plainTextToken,
                'expires_at' => $expiresAt->toISOString(),
                'abilities' => $data['abilities'],
            ];
        });
    }

    public function revoke(User $user, ?int $tokenId = null): int
    {
        return DB::transaction(function () use ($user, $tokenId): int {
            // Serialize creation and revocation of all tokens on the same account.
            $account = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($tokenId !== null) {
                $token = $account->tokens()->whereKey($tokenId)->lockForUpdate()->firstOrFail();
                $this->audit($account, 'api_token_revoked', $token);
                $token->delete();

                return 1;
            }

            $count = $account->tokens()->delete();
            if ($count > 0) {
                $this->audit($account, 'api_tokens_revoked', null, ['tokens_revoked' => $count]);
            }

            return $count;
        });
    }

    private function effectiveExpiry(PersonalAccessToken $token): ?CarbonInterface
    {
        $expiresAt = $token->expires_at;
        $globalMinutes = (int) config('sanctum.expiration', 0);

        if ($globalMinutes > 0) {
            $globalExpiry = $token->created_at->copy()->addMinutes($globalMinutes);
            $expiresAt = $expiresAt === null ? $globalExpiry : $expiresAt->min($globalExpiry);
        }

        return $expiresAt;
    }

    /** @param array<string, mixed> $changes */
    private function audit(User $user, string $event, ?PersonalAccessToken $token, array $changes = []): void
    {
        AuditLog::query()->create([
            'actor_id' => $user->id,
            'event' => $event,
            'auditable_type' => $token === null ? User::class : $token::class,
            'auditable_id' => (string) ($token?->id ?? $user->id),
            'auditable_label' => $token?->name ?? $user->name,
            'changes' => $changes === [] ? null : $changes,
            'ip_address' => Request::ip(),
        ]);
    }
}
