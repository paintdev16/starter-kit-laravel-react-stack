<?php

namespace App\Http\Requests\Settings;

use App\Concerns\RequiresRecentConfirmation;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApiTokenRequest extends FormRequest
{
    use RequiresRecentConfirmation;

    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->hasVerifiedEmail();
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'abilities' => ['required', 'array', 'min:1', 'max:2'],
            'abilities.*' => ['required', 'string', 'distinct', Rule::in(['api:read', 'api:write'])],
            'expires_in' => ['required', 'integer', Rule::in([1, 7, 30, 90])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Asigna un nombre para identificar este token.',
            'name.max' => 'El nombre no puede superar los 100 caracteres.',
            'abilities.required' => 'Selecciona al menos un permiso.',
            'abilities.min' => 'Selecciona al menos un permiso.',
            'abilities.*.in' => 'Solo se permiten los permisos de lectura y escritura.',
            'expires_in.in' => 'Elige un vencimiento de 1, 7, 30 o 90 días.',
        ];
    }
}
