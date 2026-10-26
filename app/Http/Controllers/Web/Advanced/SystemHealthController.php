<?php

namespace App\Http\Controllers\Web\Advanced;

use App\Actions\Advanced\GetSystemHealth;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SystemHealthController extends Controller
{
    public function __invoke(GetSystemHealth $health): Response
    {
        return Inertia::render('advanced/health', [
            'health' => fn (): array => $health->handle(),
        ]);
    }
}
