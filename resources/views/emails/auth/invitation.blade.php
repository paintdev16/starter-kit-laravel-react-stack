<x-mail::message :brand="$brand">
@php($expiresAt = $expiresAt->copy()->timezone($brand['timezone']))
<p class="mail-eyebrow">TU EQUIPO TE ESPERA</p>

# Tienes un lugar en {{ $brand['name'] }}

Hola **{{ $name }}**, te invitaron a formar parte de nuestro espacio de trabajo. Acepta la invitación y crea tu contraseña para comenzar.

<x-mail::panel>
**Tu invitación**

Correo de acceso: **{{ $email }}**

Válida hasta el **{{ $expiresAt->format('d/m/Y') }} a las {{ $expiresAt->format('H:i') }}** ({{ $brand['timezone'] }}).
</x-mail::panel>

<x-mail::button :url="$invitationUrl">
Aceptar invitación
</x-mail::button>

El enlace es personal y puede utilizarse una sola vez. Al aceptarlo, podrás completar tus datos y acceder con los permisos asignados por tu equipo.

Si no esperabas esta invitación, puedes ignorar este correo.

<x-slot:subcopy>
Si el botón no funciona, copia y pega este enlace en tu navegador:
[{{ $invitationUrl }}]({{ $invitationUrl }})
</x-slot:subcopy>
</x-mail::message>
