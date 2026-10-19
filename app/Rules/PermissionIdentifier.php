<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class PermissionIdentifier implements ValidationRule
{
    private const ACTIONS = [
        'view',
        'create',
        'update',
        'delete',
        'restore',
        'force-delete',
        'manage',
        'assign',
        'export',
        'import',
        'approve',
        'reject',
        'publish',
        'archive',
    ];

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('El identificador del permiso debe ser texto.');

            return;
        }

        $action = implode('|', array_map(
            static fn (string $action): string => preg_quote($action, '/'),
            self::ACTIONS,
        ));
        $segment = '[a-z]+(?:-[a-z]+)*';

        if (preg_match("/^{$segment}(?:\\.{$segment})*\\.({$action})$/", $value) !== 1) {
            $fail('Usa un identificador en inglés con el formato recurso.acción, por ejemplo permissions.delete.');
        }
    }
}
