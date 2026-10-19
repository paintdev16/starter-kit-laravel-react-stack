<x-mail::layout>
<x-slot:header>
<tr>
    <td class="header" align="center" style="padding: 30px 0 24px;">
        <a href="{{ config('app.url') }}" style="display: inline-block; color: #17264d; text-decoration: none;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                    <td align="center" valign="middle" style="width: 46px; height: 46px; border-radius: 14px; background: #8fa5ff; color: #101a3a; font-family: Arial, sans-serif; font-size: 24px; font-weight: 800;">
                        P
                    </td>
                    <td valign="middle" style="padding-left: 12px; text-align: left;">
                        <span style="display: block; color: #17264d; font-family: Arial, sans-serif; font-size: 19px; font-weight: 750; letter-spacing: -0.4px;">Paint</span>
                        <span style="display: block; margin-top: 3px; color: #7b86a0; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.7px;">CUENTA Y SEGURIDAD</span>
                    </td>
                </tr>
            </table>
        </a>
    </td>
</tr>
</x-slot:header>

<p class="mail-eyebrow">ACCESO A TU CUENTA</p>

# Restablece tu contraseña

Hola **{{ $name }}**. Recibimos una solicitud para restablecer la contraseña de tu cuenta. Crea una nueva contraseña para volver a acceder de forma segura.

<x-mail::button :url="$resetUrl" color="primary">
Crear nueva contraseña
</x-mail::button>

<x-mail::panel>
Este enlace vence en **{{ $expiresIn }} minutos** y solo puede utilizarse una vez.
</x-mail::panel>

Si no solicitaste este cambio, ignora este correo. Tu contraseña actual seguirá siendo la misma.

<x-slot:subcopy>
Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
<a href="{{ $resetUrl }}">{{ $resetUrl }}</a>
</x-slot:subcopy>

<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} Paint · Tu espacio de trabajo, protegido.
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
