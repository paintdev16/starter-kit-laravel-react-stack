@props(['brand' => null])
@php($brand = $brand ?? app(\App\Support\MailBranding::class)->data())
<x-mail::layout :brand="$brand">
<x-slot:header>
<x-mail::header :url="$brand['url']" :brand="$brand" />
</x-slot:header>

{!! $slot !!}

@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

<x-slot:footer>
<x-mail::footer :brand="$brand" />
</x-slot:footer>
</x-mail::layout>
