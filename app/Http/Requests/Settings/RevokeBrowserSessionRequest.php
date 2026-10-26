<?php

namespace App\Http\Requests\Settings;

use App\Concerns\RequiresRecentConfirmation;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RevokeBrowserSessionRequest extends FormRequest
{
    use RequiresRecentConfirmation;

    public function authorize(): bool
    {
        return $this->user() instanceof User;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [];
    }
}
