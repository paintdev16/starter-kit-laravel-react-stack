<?php

use App\Support\ApplicationFeatures;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return app(ApplicationFeatures::class)->reverbEnabled()
        && (int) $user->id === (int) $id;
});
