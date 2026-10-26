<?php

namespace App\Http\Requests\AccessControl;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class StoreUserInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('users.invite');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'roles' => ['sometimes', 'array'],
            'roles.*' => [
                'integer',
                Rule::exists('roles', 'id')->where('guard_name', 'web'),
                Rule::notIn(Role::query()->where('name', 'super-admin')->pluck('id')->all()),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo es obligatorio.',
            'email.unique' => 'Ya existe una cuenta con este correo.',
            'roles.*.exists' => 'Uno de los roles seleccionados ya no existe o no se puede asignar.',
        ];
    }
}
