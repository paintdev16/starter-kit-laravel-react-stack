<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property array<int, int> $role_ids
 * @property string $token_hash
 * @property Carbon $expires_at
 * @property Carbon|null $accepted_at
 * @property Carbon|null $canceled_at
 */
#[Fillable(['name', 'email', 'role_ids', 'invited_by', 'token_hash', 'expires_at', 'accepted_at', 'canceled_at'])]
class UserInvitation extends Model
{
    use Notifiable;

    protected function casts(): array
    {
        return [
            'role_ids' => 'array',
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'canceled_at' => 'datetime',
        ];
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function hasValidToken(string $token): bool
    {
        return $this->accepted_at === null
            && $this->canceled_at === null
            && $this->expires_at->isFuture()
            && hash_equals($this->token_hash, hash('sha256', $token));
    }
}
