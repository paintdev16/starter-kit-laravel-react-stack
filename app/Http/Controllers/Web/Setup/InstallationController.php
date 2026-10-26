<?php

namespace App\Http\Controllers\Web\Setup;

use App\Actions\Setup\CompleteInstallation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\CompleteInstallationRequest;
use App\Support\ApplicationInstallation;
use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InstallationController extends Controller
{
    public function show(ApplicationInstallation $installation): Response
    {
        abort_if($installation->completed(), 404);

        return Inertia::render('setup/index', [
            'available' => $installation->available(),
            'pending' => $installation->pending(),
            'defaults' => [
                'app_name' => config('app.name'),
                'timezone' => config('app.timezone', 'UTC'),
            ],
            'timezones' => DateTimeZone::listIdentifiers(),
        ]);
    }

    public function store(CompleteInstallationRequest $request, CompleteInstallation $complete): RedirectResponse
    {
        $complete->handle($request->validated());
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Instalación completada. Inicia sesión con tu cuenta de superadministrador.');
    }
}
