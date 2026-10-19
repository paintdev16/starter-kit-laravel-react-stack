<?php

namespace App\Http\Requests\AccessControl;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('users.update');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['integer', Rule::exists('roles', 'id')->where('guard_name', 'web')],
            'avatars' => ['sometimes', 'array', 'max:10'],
            'avatars.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo es obligatorio.',
            'email.unique' => 'Ya existe una cuenta con este correo.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'roles.*.exists' => 'Uno de los roles seleccionados ya no existe.',
            'avatars.max' => 'Puedes cargar hasta 10 imágenes por envío.',
            'avatars.*.image' => 'Cada avatar debe ser una imagen válida.',
            'avatars.*.mimes' => 'Los avatares deben estar en formato JPG, PNG o WebP.',
            'avatars.*.max' => 'Cada avatar puede pesar hasta 5 MB.',
        ];
    }
}
