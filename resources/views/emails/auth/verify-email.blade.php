<x-mail::message :brand="$brand">
<p class="mail-eyebrow">VERIFICACIÓN DE CUENTA</p>

# Confirma tu correo electrónico

Hola **{{ $name }}**, nos alegra tenerte en **{{ $brand['name'] }}**. Confirma que esta dirección te pertenece para activar tu cuenta.

<x-mail::panel>
**Tu correo de acceso**

{{ $email }}
</x-mail::panel>

<x-mail::button :url="$verificationUrl">
Confirmar mi correo
</x-mail::button>

Este enlace es válido durante **{{ $expiresIn }} minutos**. Después de confirmar tu correo, podrás acceder a tu espacio de trabajo.

Si no creaste esta cuenta, puedes ignorar este mensaje.

<x-slot:subcopy>
Si el botón no funciona, copia y pega este enlace en tu navegador:
[{{ $verificationUrl }}]({{ $verificationUrl }})
</x-slot:subcopy>
</x-mail::message>
