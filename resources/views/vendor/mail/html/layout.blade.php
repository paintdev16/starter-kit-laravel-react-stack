@props(['brand' => null])
@php($brand = $brand ?? app(\App\Support\MailBranding::class)->data())
<!DOCTYPE html>
<html lang="es">
<head>
<title>{{ $brand['name'] }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<style>
@media only screen and (max-width: 620px) {
    .wrapper { padding: 12px !important; }
    .inner-body, .footer { width: 100% !important; }
    .content-cell { padding: 28px 24px !important; }
    .header { padding: 22px 0 !important; }
    h1 { font-size: 25px !important; }
    .button { text-align: center !important; }
}
</style>
{!! $head ?? '' !!}
</head>
<body>
<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="center">
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
{!! $header ?? '' !!}
<tr>
<td class="body" width="100%" align="center">
<table class="inner-body" align="center" width="600" cellpadding="0" cellspacing="0" role="presentation">
<tr><td class="accent-line" height="5"></td></tr>
<tr>
<td class="content-cell">
{!! Illuminate\Mail\Markdown::parse($slot) !!}
{!! $subcopy ?? '' !!}
</td>
</tr>
</table>
</td>
</tr>
{!! $footer ?? '' !!}
</table>
</td>
</tr>
</table>
</body>
</html>
