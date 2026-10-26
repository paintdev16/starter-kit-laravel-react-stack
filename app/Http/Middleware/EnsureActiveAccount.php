<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        if (! $user->is_active) {
            if ($request->hasSession()) {
                Auth::guard()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Tu cuenta está suspendida. Contacta con un administrador.',
                ]);
            }

            return response()->json(['message' => 'Esta cuenta está suspendida.'], 403);
        }

        if ($request->hasSession()) {
            $sessionUserId = $request->session()->get('lifecycle.user_id');

            if ($sessionUserId !== null && (int) $sessionUserId === $user->id) {
                $sessionVersion = $request->session()->get('lifecycle.session_version');

                if ($sessionVersion !== null && (int) $sessionVersion !== $user->session_version) {
                    Auth::guard()->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()->route('login')->withErrors([
                        'email' => 'Tu sesión fue cerrada por un administrador. Inicia sesión nuevamente.',
                    ]);
                }
            }

            $request->session()->put([
                'lifecycle.user_id' => $user->id,
                'lifecycle.session_version' => $user->session_version,
            ]);
        }

        return $next($request);
    }
}
