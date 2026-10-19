<?php

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Notifications\AccountCreatedNotification;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('only super admin can change integration settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('advanced.settings.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('advanced.settings.integrations.update'), [
            'reverb_enabled' => false,
            'sanctum_enabled' => false,
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('application_settings', 0);
});

test('super admin can disable and reenable Reverb and Sanctum', function () {
    $admin = User::factory()->create();
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin->assignRole('super-admin');

    $this->actingAs($admin)
        ->get(route('advanced.settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('advanced/settings')
            ->where('features.reverb_enabled', true)
            ->where('features.sanctum_enabled', true)
        );

    $token = $admin->createToken('test device', ['api:read'])->plainTextToken;
    $this->withToken($token)->getJson(route('api.v1.me'))->assertOk();

    $this->actingAs($admin)
        ->put(route('advanced.settings.integrations.update'), [
            'reverb_enabled' => false,
            'sanctum_enabled' => false,
        ])
        ->assertRedirect();

    expect(ApplicationSetting::query()->whereKey('reverb_enabled')->value('value'))->toBe('0')
        ->and(ApplicationSetting::query()->whereKey('sanctum_enabled')->value('value'))->toBe('0')
        ->and((new AccountCreatedNotification)->via($admin))->not->toContain('broadcast');

    $this->withToken($token)->getJson(route('api.v1.me'))->assertStatus(503);
    $this->postJson(route('api.v1.auth.token.store'), [])->assertStatus(503);

    $this->actingAs($admin)
        ->put(route('advanced.settings.integrations.update'), [
            'reverb_enabled' => true,
            'sanctum_enabled' => true,
        ])
        ->assertRedirect();

    expect((new AccountCreatedNotification)->via($admin))->toContain('broadcast');
    $this->withToken($token)->getJson(route('api.v1.me'))->assertOk();
});
