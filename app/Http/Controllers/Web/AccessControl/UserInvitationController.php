<?php

namespace App\Http\Controllers\Web\AccessControl;

use App\Actions\AccessControl\InviteUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserInvitationRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Request;

class UserInvitationController extends Controller
{
    public function store(StoreUserInvitationRequest $request, InviteUser $inviteUser): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);

        $inviteUser->handle($actor, $request->validated());

        return back()->with('success', 'Invitación enviada. Vencerá en siete días.');
    }

    public function resend(UserInvitation $invitation, InviteUser $inviteUser): RedirectResponse
    {
        Gate::authorize('users.invite');
        $actor = request()->user();
        abort_unless($actor instanceof User, 401);

        $inviteUser->resend($actor, $invitation);

        return back()->with('success', 'La invitación fue enviada nuevamente.');
    }

    public function destroy(UserInvitation $invitation): RedirectResponse
    {
        Gate::authorize('users.invite');
        abort_if($invitation->accepted_at !== null || $invitation->canceled_at !== null, 422, 'Esta invitación ya no está pendiente.');

        $actor = request()->user();

        DB::transaction(function () use ($actor, $invitation): void {
            $invitation->forceFill(['canceled_at' => now()])->save();

            if ($actor instanceof User) {
                AuditLog::query()->create([
                    'actor_id' => $actor->id,
                    'event' => 'invitation_canceled',
                    'auditable_type' => UserInvitation::class,
                    'auditable_id' => (string) $invitation->getKey(),
                    'auditable_label' => $invitation->email,
                    'changes' => ['email' => $invitation->email],
                    'ip_address' => Request::ip(),
                ]);
            }
        });

        return back()->with('success', 'La invitación fue cancelada.');
    }
}
