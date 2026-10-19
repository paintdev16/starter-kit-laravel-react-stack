<?php

namespace App\Http\Middleware;

use App\Support\ApplicationFeatures;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSanctumEnabled
{
    public function __construct(private readonly ApplicationFeatures $features) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->features->sanctumEnabled()) {
            return new JsonResponse(['message' => 'La API móvil está desactivada.'], 503);
        }

        return $next($request);
    }
}
