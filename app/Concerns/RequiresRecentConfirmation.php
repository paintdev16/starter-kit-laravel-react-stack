<?php

namespace App\Concerns;

use Illuminate\Validation\Validator;

trait RequiresRecentConfirmation
{
    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $confirmedAt = (int) $this->session()->get('auth.password_confirmed_at', 0);
            $now = now()->getTimestamp();

            if ($confirmedAt <= 0 || $confirmedAt > $now || $now - $confirmedAt > 300) {
                $validator->errors()->add('confirmation', 'Confirma tu identidad de nuevo para continuar.');
            }
        }];
    }
}
