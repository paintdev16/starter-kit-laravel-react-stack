<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class InvitationAcceptanceController extends Controller
{
    public function show(UserInvitation $invitation, string $token): Response
    {
        abort_unless($invitation->hasValidToken($token), 404);

        return Inertia::render('auth/accept-invitation', [
            'invitation' => [
                'id' => $invitation->id,
                'name' => $invitation->name,
                'email' => $invitation->email,
                'expiresAt' => $invitation->expires_at->toISOString(),
            ],
            'token' => $token,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function store(Request $request, UserInvitation $invitation, string $token): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        DB::transaction(function () use ($invitation, $token, $validated): void {
            $invitation = UserInvitation::query()->lockForUpdate()->findOrFail($invitation->id);
            abort_unless($invitation->hasValidToken($token), 404);
            $user = User::query()
                ->whereRaw('LOWER(email) = ?', [$invitation->email])
                ->lockForUpdate()
                ->first();

            if ($user?->email_verified_at !== null) {
                throw ValidationException::withMessages([
                    'email' => 'Este correo ya tiene una cuenta. Inicia sesión para continuar.',
                ]);
            }

            if ($user === null) {
                $user = User::query()->create([
                    'name' => $validated['name'],
                    'email' => $invitation->email,
                    'password' => $validated['password'],
                    'email_verified_at' => now(),
                ]);
            } else {
                $user->forceFill([
                    'name' => $validated['name'],
                    'password' => $validated['password'],
                    'email_verified_at' => now(),
                    'is_active' => true,
                ])->save();
            }

            $roles = Role::query()
                ->whereKey($invitation->role_ids)
                ->where('guard_name', 'web')
                ->where('name', '!=', 'super-admin')
                ->get();
            $user->syncRoles($roles);
            $invitation->forceFill(['accepted_at' => now()])->save();
        });

        return redirect()->route('login')->with('status', 'Invitación aceptada. Ya puedes iniciar sesión.');
    }
}
