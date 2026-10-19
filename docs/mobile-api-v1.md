# API móvil v1

Base URL: `/api/v1`. Las respuestas son JSON. Salvo la emisión del token, las rutas requieren `Authorization: Bearer <token>`.

## Sesión

`POST /auth/token` recibe `email`, `password` y `device_name`. Devuelve un token Bearer de Sanctum con abilities `api:read` y `api:write`, válido por 30 días. Guárdalo de forma segura en el almacenamiento protegido del dispositivo.

`DELETE /auth/token` revoca el token actual.

## Rutas

| Método | Ruta | Ability | Acceso adicional |
| --- | --- | --- | --- |
| GET | `/me` | `api:read` | Usuario autenticado |
| GET | `/notifications` | `api:read` | Solo notificaciones del usuario |
| PATCH | `/notifications/{id}/read` | `api:write` | Solo notificaciones del usuario |
| PATCH | `/notifications/read-all` | `api:write` | Solo notificaciones del usuario |
| GET | `/users` | `api:read` | Permiso `users.view` |
| GET | `/users/{id}` | `api:read` | Permiso `users.view` |

La lista de usuarios y notificaciones está paginada. Laravel devuelve `data`, `links` y `meta`.

## Canal privado de Reverb

El usuario autenticado puede suscribirse a `private-App.Models.User.{id}` para recibir notificaciones en tiempo real. Para clientes móviles con token Bearer, autoriza la suscripción mediante `POST /api/v1/broadcasting/auth`, enviando también el encabezado `Authorization: Bearer <token>`. El servidor confirma que el ID del canal pertenece al token autenticado.

## Desarrollo

Ejecuta Reverb y un worker de cola en terminales separadas:

```sh
php artisan reverb:start
php artisan queue:work
```

`php artisan reverb:install` crea credenciales locales y las variables `VITE_REVERB_*`. En producción configura TLS, `REVERB_ALLOWED_ORIGINS` con los orígenes permitidos y un worker persistente de colas.
