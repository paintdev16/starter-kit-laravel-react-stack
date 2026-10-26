<?php

namespace App\Http\Requests\Setup;

use App\Concerns\ProfileValidationRules;
use App\Support\ApplicationInstallation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CompleteInstallationRequest extends FormRequest
{
    use ProfileValidationRules;

    public function authorize(ApplicationInstallation $installation): bool
    {
        return $installation->available();
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            ...$this->profileRules(),
            'setup_token' => ['required', 'string', 'size:64', 'regex:/\A[A-Za-z0-9]+\z/'],
            'app_name' => ['required', 'string', 'max:100'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'timezone' => ['required', 'timezone'],
            'password' => ['required', 'string', 'max:255', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols()],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'setup_token' => 'código de instalación',
            'name' => 'nombre completo',
            'email' => 'correo del administrador',
            'app_name' => 'nombre de la aplicación',
            'support_email' => 'correo de soporte',
            'timezone' => 'zona horaria',
            'password' => 'contraseña',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'setup_token.required' => 'Ingresa el código generado por el comando app:install.',
            'setup_token.size' => 'Copia el código completo de 64 caracteres.',
            'setup_token.regex' => 'El código de instalación no tiene el formato correcto.',
            'password.min' => 'La contraseña debe tener al menos 12 caracteres.',
            'password.mixed' => 'Incluye letras mayúsculas y minúsculas.',
            'password.numbers' => 'Incluye al menos un número.',
            'password.symbols' => 'Incluye al menos un símbolo.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ];
    }
}
