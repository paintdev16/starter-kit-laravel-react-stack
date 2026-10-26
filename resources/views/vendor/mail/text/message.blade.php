@props(['brand' => null])
@php($brand = $brand ?? app(\App\Support\MailBranding::class)->data())
<x-mail::layout>
<x-slot:header>{{ $brand['name'] }}</x-slot:header>

{{ $slot }}

@isset($subcopy)
<x-slot:subcopy>{{ $subcopy }}</x-slot:subcopy>
@endisset

<x-slot:footer>
{{ $brand['name'] }} · Tu espacio de trabajo, protegido.
@if ($brand['supportEmail'])
¿Necesitas ayuda? {{ $brand['supportEmail'] }}
@endif
© {{ $brand['year'] }} {{ $brand['name'] }}. Todos los derechos reservados.
Este es un mensaje automático relacionado con tu cuenta.
</x-slot:footer>
</x-mail::layout>
