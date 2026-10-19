<?php

namespace App\Http\Requests\AccessControl;

use App\Models\Permission;
use App\Rules\PermissionIdentifier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('permissions.update') ?? false;
    }

    public function rules(): array
    {
        /** @var Permission $permission */
        $permission = $this->route('permission');

        return [
            'name' => [
                'required',
                'string',
                'max:125',
                new PermissionIdentifier,
                Rule::unique('permissions')->where('guard_name', 'web')->ignore($permission->getKey()),
            ],
            'label' => ['required', 'string', 'max:125'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del permiso es obligatorio.',
            'name.unique' => 'Ya existe un permiso con este nombre.',
            'label.required' => 'La etiqueta del permiso es obligatoria.',
        ];
    }
}
