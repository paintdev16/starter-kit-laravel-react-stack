<?php

namespace App\Providers;

use App\Listeners\NotifySuperAdminsOfBackupProblem;
use App\Models\ApplicationSetting;
use App\Models\Permission;
use App\Models\User;
use App\Observers\AuditObserver;
use App\Support\ApplicationFeatures;
use App\Support\BackupArchivePassword;
use App\Support\FeatureAwareReverbApplicationProvider;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\DevCommands;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Reverb\Contracts\ApplicationProvider;
use Spatie\Backup\Events\BackupHasFailed;
use Spatie\Backup\Events\CleanupHasFailed;
use Spatie\Backup\Events\UnhealthyBackupWasFound;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->extend(
            ApplicationProvider::class,
            fn (ApplicationProvider $provider): ApplicationProvider => new FeatureAwareReverbApplicationProvider(
                $provider,
                $this->app->make(ApplicationFeatures::class),
            ),
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        DevCommands::artisan('reverb:start', 'reverb');
        DevCommands::artisan('schedule:work', 'scheduler');
        DevCommands::artisan('queue:work backup_restores --queue=backup-restores --timeout=3600 --tries=1', 'backup-worker');

        $this->configureDefaults();

        try {
            $this->app->make(BackupArchivePassword::class)->apply();
        } catch (QueryException) {
            // La instalación inicial y la recuperación pueden arrancar sin la tabla de ajustes.
        }

        Gate::before(function (User $user): ?bool {
            return $user->hasRole('super-admin') ? true : null;
        });

        Gate::define('social-login.manage', fn (User $user): bool => $user->hasRole('super-admin'));
        Gate::define('manage-advanced', fn (User $user): bool => $user->hasRole('super-admin'));

        User::observe(AuditObserver::class);
        Role::observe(AuditObserver::class);
        Permission::observe(AuditObserver::class);
        ApplicationSetting::observe(AuditObserver::class);

        Event::listen([
            BackupHasFailed::class,
            CleanupHasFailed::class,
            UnhealthyBackupWasFound::class,
        ], NotifySuperAdminsOfBackupProblem::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
