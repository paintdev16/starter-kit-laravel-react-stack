<x-mail::message :brand="$brand">
<p class="mail-eyebrow">BIENVENIDA A TU ESPACIO</p>

# Tu cuenta está lista

Hola **{{ $name }}**, ya tienes una cuenta en **{{ $brand['name'] }}**. Tu equipo ha preparado tu acceso para que puedas comenzar.

<x-mail::panel>
**Tu correo de acceso**

{{ $email }}
</x-mail::panel>

<x-mail::button :url="$loginUrl">
Iniciar sesión
</x-mail::button>

Utiliza las credenciales que te proporcionó tu administrador. Si necesitas establecer una nueva contraseña, puedes hacerlo desde la pantalla de inicio de sesión.

Si no reconoces esta cuenta, contacta con el equipo de soporte.

<x-slot:subcopy>
Si el botón no funciona, copia y pega este enlace en tu navegador:
[{{ $loginUrl }}]({{ $loginUrl }})
</x-slot:subcopy>
</x-mail::message>
