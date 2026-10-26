<?php

namespace App\Http\Middleware;

use App\Models\ApplicationSetting;
use App\Support\ApplicationFeatures;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(private readonly ApplicationFeatures $features) {}

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $applicationSettings = ApplicationSetting::query()
            ->whereIn('key', ['app_name', 'support_email', 'timezone'])
            ->pluck('value', 'key');

        $appName = $applicationSettings->get('app_name') ?? config('app.name');
        config(['app.name' => $appName]);

        if (filled($applicationSettings->get('timezone'))) {
            config(['app.timezone' => $applicationSettings->get('timezone')]);
            date_default_timezone_set($applicationSettings->get('timezone'));
        }

        return [
            ...parent::share($request),
            'name' => $appName,
            'applicationSettings' => [
                'supportEmail' => $applicationSettings->get('support_email'),
                'timezone' => $applicationSettings->get('timezone') ?? config('app.timezone'),
            ],
            'runtimeFeatures' => $this->features->reverbState(),
            'auth' => [
                'user' => function () use ($request): ?array {
                    $user = $request->user();

                    if ($user === null) {
                        return null;
                    }

                    $user->loadMissing('latestAvatar');
                    $userData = $user->toArray();
                    unset($userData['latest_avatar']);
                    $userData['avatar'] = $user->latestAvatar?->url;

                    return $userData;
                },
                'roles' => fn (): array => $request->user()?->getRoleNames()->values()->all() ?? [],
                'permissions' => fn (): array => $request->user()?->getAllPermissions()
                    ->map(fn ($permission): array => [
                        'name' => $permission->name,
                        'label' => $permission->label,
                    ])
                    ->values()
                    ->all() ?? [],
                'can' => [
                    'viewAccessControl' => $request->user()?->can('access-control.view') ?? false,
                    'createRoles' => $request->user()?->can('roles.create') ?? false,
                    'updateRoles' => $request->user()?->can('roles.update') ?? false,
                    'deleteRoles' => $request->user()?->can('roles.delete') ?? false,
                    'createPermissions' => $request->user()?->can('permissions.create') ?? false,
                    'updatePermissions' => $request->user()?->can('permissions.update') ?? false,
                    'deletePermissions' => $request->user()?->can('permissions.delete') ?? false,
                    'viewUsers' => $request->user()?->can('users.view') ?? false,
                    'createUsers' => $request->user()?->can('users.create') ?? false,
                    'inviteUsers' => $request->user()?->can('users.invite') ?? false,
                    'updateUsers' => $request->user()?->can('users.update') ?? false,
                    'suspendUsers' => $request->user()?->can('users.suspend') ?? false,
                    'deleteUsers' => $request->user()?->can('users.delete') ?? false,
                    'manageAdvanced' => $request->user()?->can('manage-advanced') ?? false,
                ],
                'unreadNotifications' => fn (): int => $request->user()?->unreadNotifications()->count() ?? 0,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
