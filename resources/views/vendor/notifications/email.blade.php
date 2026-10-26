<x-mail::message>
# {{ $greeting ?: ($level === 'error' ? 'Ocurrió un problema' : 'Hola') }}

@foreach ($introLines as $line)
{{ $line }}

@endforeach

@isset($actionText)
<x-mail::button :url="$actionUrl" :color="$level === 'error' ? 'error' : 'primary'">
{{ $actionText }}
</x-mail::button>
@endisset

@foreach ($outroLines as $line)
{{ $line }}

@endforeach

{{ $salutation ?: 'Gracias por ser parte de nuestro equipo.' }}

@isset($actionText)
<x-slot:subcopy>
Si el botón «{{ $actionText }}» no funciona, copia y pega este enlace en tu navegador:
[{{ $displayableActionUrl }}]({{ $actionUrl }})
</x-slot:subcopy>
@endisset
</x-mail::message>
