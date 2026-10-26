<?php

use App\Models\ApplicationSetting;
use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\AccountCreatedNotification;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\UserInvitationNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Mail\Markdown;
use Illuminate\Notifications\Messages\MailMessage;

test('transactional emails use the configured brand outside an HTTP request', function (string $type, string $headline, string $action) {
    $this->freezeTime();
    config(['app.name' => 'Laravel', 'mail.from.address' => 'no-reply@example.test', 'mail.from.name' => 'Laravel']);
    ApplicationSetting::query()->insert([
        ['key' => 'app_name', 'value' => 'Aula Norte'],
        ['key' => 'support_email', 'value' => 'soporte@example.test'],
        ['key' => 'timezone', 'value' => 'America/Lima'],
    ]);
    $user = User::factory()->make(['id' => 42, 'name' => 'Ana', 'email' => 'ana@example.test']);
    $invitation = new UserInvitation;
    $invitation->forceFill(['name' => 'Ana', 'email' => 'ana@example.test', 'expires_at' => now()->addDays(7)]);

    $message = match ($type) {
        'verification' => (new VerifyEmailNotification)->toMail($user),
        'password-reset' => (new ResetPasswordNotification('preview-token'))->toMail($user),
        'invitation' => (new UserInvitationNotification('https://workspace.example.test/invitations/42/preview-token'))->toMail($invitation),
        'account-created' => (new AccountCreatedNotification)->toMail($user),
    };
    $html = (string) $message->render();
    $text = (string) app(Markdown::class)->renderText($message->markdown, $message->data());

    expect($html)
        ->toContain($headline, $action, 'Aula Norte', 'TU ESPACIO DE TRABAJO', 'soporte@example.test', 'Si el botón no funciona')
        ->not->toContain('Regards', 'If you’re having trouble', "If you're having trouble", 'Laravel Logo', 'notification-logo-v2.1.png');
    expect($message->from)->toBe(['no-reply@example.test', 'Aula Norte']);
    expect($message->subject)->toContain('Aula Norte');
    expect($text)->toContain($headline, $action, 'Aula Norte', 'soporte@example.test')->not->toContain('<table');
    expect(config('app.name'))->toBe('Laravel');
})->with([
    ['verification', 'Confirma tu correo electrónico', 'Confirmar mi correo'],
    ['password-reset', 'Recupera tu acceso', 'Crear nueva contraseña'],
    ['invitation', 'Tienes un lugar en Aula Norte', 'Aceptar invitación'],
    ['account-created', 'Tu cuenta está lista', 'Iniciar sesión'],
]);

test('consecutive emails pick up a brand change without restarting the worker', function () {
    config(['app.name' => 'Laravel']);
    ApplicationSetting::query()->insert(['key' => 'app_name', 'value' => 'Primera marca']);
    $user = User::factory()->make(['name' => 'Ana']);
    $notification = new AccountCreatedNotification;
    $first = $notification->toMail($user);

    ApplicationSetting::query()->where('key', 'app_name')->update(['value' => 'Nueva marca']);
    $second = $notification->toMail($user);

    expect((string) $first->render())->toContain('Primera marca');
    expect((string) $second->render())->toContain('Nueva marca')->not->toContain('Primera marca');
    expect($second->from[1])->toBe('Nueva marca');
});

test('generic notification emails have a Spanish branded fallback without support settings', function () {
    config(['app.name' => 'Proyecto Base']);
    $message = (new MailMessage)->line('Un aviso de tu cuenta.')->action('Consultar aviso', 'https://workspace.example.test/notice');

    $html = (string) $message->render();

    expect($html)
        ->toContain('Proyecto Base', 'Consultar aviso', 'copia y pega este enlace', 'Todos los derechos reservados')
        ->not->toContain('Regards', 'mailto:', '¿Necesitas ayuda?', 'notification-logo-v2.1.png');
});

test('email branding and recipient names are escaped in the rendered email', function () {
    ApplicationSetting::query()->insert(['key' => 'app_name', 'value' => '<script>alert(1)</script>']);
    $user = User::factory()->make(['name' => '<img src=x onerror=alert(1)>']);

    $html = (string) (new AccountCreatedNotification)->toMail($user)->render();

    expect($html)->not->toContain('<script>', '<img src=x')->toContain('&lt;script&gt;', '&lt;img');
});
