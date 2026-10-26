@props(['brand' => null])
@php($brand = $brand ?? app(\App\Support\MailBranding::class)->data())
<tr>
<td align="center">
<table class="footer" align="center" width="600" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="center" class="footer-content">
<p class="footer-brand">{{ $brand['name'] }} · Tu espacio de trabajo, protegido.</p>
@if ($brand['supportEmail'])
<p>¿Necesitas ayuda? <a href="mailto:{{ $brand['supportEmail'] }}">{{ $brand['supportEmail'] }}</a></p>
@endif
<p>© {{ $brand['year'] }} {{ $brand['name'] }}. Todos los derechos reservados.</p>
<p class="footer-note">Este es un mensaje automático relacionado con tu cuenta.</p>
</td>
</tr>
</table>
</td>
</tr>
