<?php

namespace App\Http\Controllers\Web\Settings;

use App\Actions\Settings\ManageBrowserSessions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\RevokeBrowserSessionRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class BrowserSessionController extends Controller
{
    public function destroy(RevokeBrowserSessionRequest $request, ManageBrowserSessions $sessions, string $session): RedirectResponse
    {
        $sessions->revoke($request->user(), $request, $session);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesión cerrada.']);

        return to_route('profile.edit');
    }

    public function destroyOthers(RevokeBrowserSessionRequest $request, ManageBrowserSessions $sessions): RedirectResponse
    {
        $count = $sessions->revoke($request->user(), $request);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $count > 0 ? 'Las demás sesiones fueron cerradas. Este dispositivo sigue conectado.' : 'No había otras sesiones para cerrar.',
        ]);

        return to_route('profile.edit');
    }
}
