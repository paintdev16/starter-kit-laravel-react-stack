<?php

namespace App\Http\Middleware;

use App\Support\ApplicationInstallation;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstallationIsReady
{
    public function __construct(private readonly ApplicationInstallation $installation) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('setup.*')) {
            $response = $next($request);
            $response->headers->set('Cache-Control', 'no-store');
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

            return $response;
        }

        if (! $this->installation->pending()) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Completa la instalación inicial para continuar.'], 503);
        }

        return redirect()->route('setup.show');
    }
}
