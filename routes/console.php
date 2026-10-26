<?php

use App\Support\ApplicationFeatures;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:run')->dailyAt('02:00')->when(fn (): bool => app(ApplicationFeatures::class)->backupsEnabled())->withoutOverlapping(180);
Schedule::command('backup:clean')->dailyAt('03:00')->when(fn (): bool => app(ApplicationFeatures::class)->backupsEnabled())->withoutOverlapping(120);
Schedule::command('backup:monitor')->dailyAt('04:00')->when(fn (): bool => app(ApplicationFeatures::class)->backupsEnabled())->withoutOverlapping(60);
Schedule::command('backup:verify')->dailyAt('05:00')->when(fn (): bool => app(ApplicationFeatures::class)->backupsEnabled())->withoutOverlapping(120);
