<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Laravel\Reverb\Application;
use Laravel\Reverb\Contracts\ApplicationProvider;
use Laravel\Reverb\Exceptions\InvalidApplication;

class FeatureAwareReverbApplicationProvider implements ApplicationProvider
{
    public function __construct(
        private readonly ApplicationProvider $applications,
        private readonly ApplicationFeatures $features,
    ) {}

    /** @return Collection<Application> */
    public function all(): Collection
    {
        return $this->applications->all();
    }

    public function findById(string $id): Application
    {
        $this->ensureEnabled();

        return $this->applications->findById($id);
    }

    public function findByKey(string $key): Application
    {
        $this->ensureEnabled();

        return $this->applications->findByKey($key);
    }

    private function ensureEnabled(): void
    {
        if (! $this->features->reverbEnabled()) {
            throw new InvalidApplication;
        }
    }
}
