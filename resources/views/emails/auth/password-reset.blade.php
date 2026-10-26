<x-mail::message :brand="$brand">
<p class="mail-eyebrow">SEGURIDAD DE TU CUENTA</p>

# Recupera tu acceso

Hola **{{ $name }}**, recibimos una solicitud para restablecer la contraseña de tu cuenta en **{{ $brand['name'] }}**.

<x-mail::button :url="$resetUrl">
Crear nueva contraseña
</x-mail::button>

<x-mail::panel>
**Enlace de un solo uso**

Tienes **{{ $expiresIn }} minutos** para elegir tu nueva contraseña.
</x-mail::panel>

Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo la misma.

<x-slot:subcopy>
Si el botón no funciona, copia y pega este enlace en tu navegador:
[{{ $resetUrl }}]({{ $resetUrl }})
</x-slot:subcopy>
</x-mail::message>
