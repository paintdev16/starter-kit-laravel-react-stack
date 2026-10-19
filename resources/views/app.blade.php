<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Apply the cookie-backed theme before the page is painted. --}}
        <script>
            (function() {
                const cookie = document.cookie
                    .split(';')
                    .map((entry) => entry.trim())
                    .find((entry) => entry.startsWith('appearance='));
                const storedAppearance = cookie?.slice('appearance='.length);
                const appearance =
                    storedAppearance === 'light' ||
                    storedAppearance === 'dark' ||
                    storedAppearance === 'system'
                        ? storedAppearance
                        : 'system';
                const isDark = appearance === 'dark' || (
                    appearance === 'system' &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches
                );

                document.documentElement.dataset.appearance = appearance;
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
            })();
        </script>

        {{-- Keep the page background correct while the stylesheet loads. --}}
        <style>
            html {
                background-color: #e8efff;
            }

            html.dark {
                background-color: oklch(0.15 0.015 260);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
