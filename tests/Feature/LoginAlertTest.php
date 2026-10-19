<?php

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Notifications\UserLoggedInNotification;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('every completed login alerts all super admins', function () {
    ApplicationSetting::query()->create(['key' => 'reverb_enabled', 'value' => '0']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);

    $firstAdmin = User::factory()->create();
    $firstAdmin->assignRole('super-admin');
    $secondAdmin = User::factory()->create();
    $secondAdmin->assignRole('super-admin');
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    $this->assertAuthenticatedAs($user);
    $this->assertDatabaseCount('notifications', 2);
    $this->assertDatabaseHas('notifications', [
        'notifiable_id' => $firstAdmin->id,
        'type' => UserLoggedInNotification::class,
    ]);
    $this->assertDatabaseHas('notifications', [
        'notifiable_id' => $secondAdmin->id,
        'type' => UserLoggedInNotification::class,
    ]);
    expect($user->notifications()->count())->toBe(0)
        ->and($firstAdmin->notifications()->first()->data['title'])->toBe('Nuevo inicio de sesión')
        ->and($firstAdmin->notifications()->first()->data['message'])->toContain($user->email);

    $this->post(route('logout'))->assertRedirect();
    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    expect($firstAdmin->notifications()->count())->toBe(2)
        ->and($secondAdmin->notifications()->count())->toBe(2);
});

test('failed login does not alert super admins', function () {
    ApplicationSetting::query()->create(['key' => 'reverb_enabled', 'value' => '0']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('super-admin');
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'incorrecta',
    ]);

    $this->assertGuest();
    expect($admin->notifications()->count())->toBe(0);
});

test('login alert data is shared only with super admins', function () {
    ApplicationSetting::query()->create(['key' => 'reverb_enabled', 'value' => '0']);
    Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('super-admin');
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('loginAlerts', 1)
            ->where('loginAlerts.0.title', 'Nuevo inicio de sesión')
        );

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('loginAlerts', [])
        );
});
