@props(['url', 'brand' => null])
@php($brand = $brand ?? app(\App\Support\MailBranding::class)->data())
<tr>
<td class="header" align="center">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
<table role="presentation" cellpadding="0" cellspacing="0" align="center">
<tr>
<td class="brand-icon" align="center" valign="middle" width="48" height="48">{{ $brand['initial'] }}</td>
<td class="brand-wordmark" valign="middle">
<span class="brand-name">{{ $brand['name'] }}</span>
<span class="brand-tagline">TU ESPACIO DE TRABAJO</span>
</td>
</tr>
</table>
</a>
</td>
</tr>
