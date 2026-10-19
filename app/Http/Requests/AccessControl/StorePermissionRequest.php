<?php

namespace App\Http\Requests\AccessControl;

use App\Rules\PermissionIdentifier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('permissions.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:125', new PermissionIdentifier, Rule::unique('permissions')->where('guard_name', 'web')],
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
