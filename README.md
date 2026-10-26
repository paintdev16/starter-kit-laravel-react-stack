# Starter kit Laravel + React

Base reutilizable para aplicaciones administrativas con Laravel, React e Inertia. Incluye autenticación, control de acceso, ajustes y módulos opcionales de API móvil y tiempo real.

## Stack

- PHP 8.3 o superior y Laravel 13.
- React 19, TypeScript, Inertia.js 3 y Tailwind CSS 4.
- Laravel Fortify para autenticación, verificación de correo, 2FA y passkeys.
- Spatie Laravel Permission para roles y permisos.
- Laravel Socialite para inicio de sesión con Google y GitHub.
- Laravel Sanctum para tokens de API.
- Laravel Reverb para notificaciones y eventos en tiempo real.
- Laravel Wayfinder para generar rutas tipadas para el frontend.

## Requisitos

- PHP 8.3+, Composer y extensiones PHP requeridas por Laravel.
- Node.js 22+ y pnpm (el repositorio incluye `pnpm-lock.yaml`).
- SQLite para desarrollo local, o una base de datos compatible con Laravel.

## Instalación

```sh
composer install
```

Crea el archivo de entorno y genera la clave de la aplicación:

```sh
cp .env.example .env
php artisan key:generate
```

En PowerShell, el equivalente de `cp` es:

```powershell
Copy-Item .env.example .env
```

Instala las dependencias del frontend, prepara la base de datos y genera los recursos:

```sh
pnpm install
php artisan migrate
pnpm run build
```

El entorno de ejemplo usa SQLite, sesiones, caché y colas en base de datos. Si eliges otro motor, configura `DB_*` en `.env` antes de migrar.

Para iniciar el entorno de desarrollo:

```sh
composer dev
```

Este comando usa el comando de desarrollo de Laravel para iniciar la aplicación y los procesos configurados por el proyecto. Si prefieres iniciar los procesos por separado, puedes usar:

```sh
php artisan serve
pnpm dev
php artisan queue:work
php artisan reverb:start
```

## Instalación inicial y primer super-admin

En una base nueva, después de ejecutar las migraciones y antes de abrir el acceso público, habilita el asistente desde el servidor:

```sh
php artisan app:install
```

El comando muestra la dirección `/setup` y un código privado de 64 caracteres, válido durante 60 minutos. Abre esa dirección y completa:

1. El código de instalación generado en la terminal.
2. El nombre de la aplicación, correo de soporte opcional y zona horaria.
3. El nombre, correo y contraseña del primer super-admin.

La contraseña debe tener al menos 12 caracteres, mayúsculas, minúsculas, números y símbolos. El asistente crea los roles y permisos iniciales, sin usuarios de demostración. La primera cuenta queda activa y con el correo verificado porque se aprovisiona mediante el código privado del operador del servidor; al finalizar, inicia sesión con sus credenciales.

Mientras el asistente está habilitado, las rutas web de la aplicación, incluido el registro público, redirigen a `/setup`. El estado de salud `/up` sigue disponible. Si el código vence, repite `php artisan app:install` y recarga el asistente: el nuevo código reemplaza al anterior. Solo se almacena su hash; el código no se coloca en la URL ni se conserva como entrada de sesión tras un error de validación.

Al completarlo, el código se elimina del estado de instalación y `/setup` queda bloqueado. El comando también rechaza bases que ya tienen usuarios o una instalación completada, incluso si luego se eliminan todas las cuentas. No se habilita automáticamente en aplicaciones existentes ni sirve para elevar permisos de usuarios existentes.

El asistente requiere `.env`, clave de aplicación, base de datos y migraciones preparados; las credenciales SMTP, OAuth, Reverb y demás servicios se configuran en el entorno del servidor.

## Datos de ejemplo para desarrollo

Para poblar roles, permisos y usuarios de demostración en una base local:

```sh
php artisan db:seed
```

El seeder crea cuentas de ejemplo con una contraseña compartida y asigna `super-admin` al usuario más antiguo. **Úsalo solo en desarrollo o en una base descartable; no ejecutes el seeder de demostración en producción.** Para una instalación real, utiliza el asistente anterior sobre una base sin usuarios.

## Funcionalidades

- Registro e inicio de sesión, recuperación y verificación de correo.
- Asistente de instalación inicial protegido con código temporal, creación del primer super-admin y bloqueo al finalizar.
- Autenticación de dos factores y passkeys.
- Usuarios, roles y permisos administrables.
- Inicio de sesión social con Google y GitHub cuando se configuran sus credenciales.
- Preferencias de perfil, apariencia y configuración general de la aplicación.
- Invitaciones por correo con vencimiento, aceptación, reenvío y cancelación; suspensión y reactivación de cuentas.
- Revocación administrativa de sesiones web, tokens API y passkeys al suspender una cuenta.
- Sesiones y dispositivos en el perfil: navegador, sistema, IP y última actividad; cierre individual o de las demás sesiones con confirmación de contraseña o passkey y auditoría.
- Administración de tokens API en el perfil: creación con permisos y vencimiento, consulta de último uso y revocación individual o total.
- Auditoría y notificaciones en la aplicación.
- API REST versionada bajo `/api/v1`, protegida con Sanctum.
- Notificaciones en tiempo real mediante canales privados de Reverb.
- Interruptores de integraciones administrables por superadministradores.
- Respaldos cifrados de base de datos y archivos persistentes, con programación, retención, monitoreo y avisos de fallo.

La documentación de endpoints, tokens y canal móvil está en [`docs/mobile-api-v1.md`](docs/mobile-api-v1.md).

## Sesiones y dispositivos

En **Perfil → Seguridad → Sesiones y dispositivos**, cada usuario puede consultar sus sesiones web activas y cerrar una sesión concreta o todas las demás. La sesión actual se identifica como **Este dispositivo** y se conserva al revocar otras sesiones.

La función utiliza `SESSION_DRIVER=database` y respeta `SESSION_CONNECTION`, `SESSION_TABLE` y `SESSION_LIFETIME`. Con otros drivers, la interfaz informa que la administración de sesiones no está disponible. Las sesiones vencidas se excluyen de la lista; el navegador y sistema se identifican a partir del agente de usuario, sin geolocalización por IP.

Antes de revocar se confirma la identidad con la contraseña actual o una passkey registrada. El servidor exige una confirmación de los últimos cinco minutos, limita los intentos de confirmación de contraseña y las solicitudes de cierre, y restringe las operaciones a sesiones propias. Los identificadores de sesión reales y sus datos internos no se envían al navegador ni se incluyen en auditoría: se utilizan referencias HMAC para las acciones.

Al cerrar sesiones también se renueva el token de «Recordarme» de la cuenta para impedir que los accesos anteriores restauren automáticamente una sesión revocada. Las demás sesiones que se conserven siguen funcionando, pero tendrán que autenticarse cuando venza su sesión. Cada revocación efectiva se registra en auditoría. El dispositivo revocado pierde acceso al realizar su siguiente petición autenticada; las pestañas visibles detectan la pérdida de sesión mediante la consulta periódica del centro de notificaciones. Este control administra sesiones web; los tokens de la API móvil se gestionan por separado.

## Administración de tokens API

En **Perfil → Seguridad → Tokens API**, cada usuario puede consultar sus tokens, incluidos los emitidos por el endpoint móvil. Se muestran nombre, permisos, fecha de creación, último uso, vencimiento efectivo y estado. Los tokens revocados se eliminan del listado; las revocaciones realizadas desde el perfil quedan registradas en auditoría.

Para crear un token, la cuenta debe estar activa, con correo verificado y Sanctum habilitado. Se puede elegir lectura (`api:read`), escritura (`api:write`) o ambas, y vencimiento en 1, 7, 30 o 90 días. Los permisos y autorizaciones de la cuenta siguen aplicándose a las rutas de la API. Si `sanctum.expiration` fija un plazo global menor, se respeta ese límite tanto al crear como al mostrar los tokens.

La creación y revocación requieren confirmar la identidad con contraseña o una passkey registrada; el servidor comprueba que la confirmación tenga menos de cinco minutos. Las rutas limitan la frecuencia de solicitudes y restringen cada operación a tokens propios.

El valor completo del token se muestra únicamente en la ventana que aparece al crearlo, con opción de copiarlo. Al cerrar la ventana se descarta de la interfaz. Se entrega mediante una respuesta JSON marcada `no-store`, sin incluirlo en props de Inertia, flash, almacenamiento del navegador o auditoría; Sanctum conserva su hash en la base de datos. Si se pierde, revoca el token y crea otro.

Al desactivar Sanctum se bloquea la creación y el uso de la API, pero siguen disponibles la consulta y revocación de tokens existentes. Revocar tokens no cierra la sesión web. Este módulo utiliza la tabla `personal_access_tokens` existente y no requiere migraciones adicionales.

## Variables e integraciones

La configuración inicial está en [`.env.example`](.env.example). Las integraciones requieren credenciales propias:

- **Google y GitHub:** configura `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` y `GITHUB_REDIRECT_URI`.
- **Correo:** ajusta `MAIL_*` al proveedor que utilizarás. La verificación de correo y el restablecimiento de contraseña dependen de un transporte de correo funcional.
- **Reverb:** configura `REVERB_*` para el servidor y `VITE_REVERB_*` para el cliente. En desarrollo, `composer dev` inicia los procesos configurados; en producción, Reverb y las colas deben ejecutarse como procesos persistentes.
- **Sanctum:** la API móvil está en `/api/v1`; los tokens se emiten desde el endpoint documentado y las rutas comprueban autenticación, abilities y permisos.

Las funciones Reverb y Sanctum también se pueden habilitar o deshabilitar desde la configuración de integraciones, con acceso de superadministrador. Deshabilitar una integración desde la aplicación bloquea su uso en la aplicación; no sustituye la configuración de credenciales o procesos del servidor.

## Calidad y pruebas

```sh
pnpm run check
pnpm run types:check
composer test
```

`composer test` ejecuta el formato PHP en modo de comprobación, PHPStan y la suite Pest. El workflow de GitHub Actions ejecuta las verificaciones del proyecto en cada pull request y en cambios a `main`.

Para compilar los recursos de producción:

```sh
pnpm run build
```

## Despliegue

Antes de desplegar:

1. Define `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, la clave de aplicación y las credenciales de base de datos.
2. Configura un proveedor de correo y, si aplica, credenciales OAuth, almacenamiento y Reverb.
3. Ejecuta las migraciones con `php artisan migrate --force`.
4. Compila los recursos con `pnpm run build`.
5. Mantén workers para colas y Reverb bajo un supervisor de procesos; configura TLS, dominios/orígenes permitidos y almacenamiento persistente según tu infraestructura.
6. No publiques `.env`, claves, tokens ni las credenciales de demostración.

Laravel expone el endpoint de salud `/up` para comprobaciones básicas del estado de la aplicación.

El super-admin dispone de **Salud del sistema** en `/admin/health`. La vista comprueba con operaciones reales la base de datos, la caché y el disco predeterminado; envía una tarea de prueba a la cola configurada para confirmar que un worker la procesa; y muestra si este navegador mantiene una conexión con Reverb cuando la integración está habilitada. Los resultados se actualizan cada 10 segundos mientras la vista está abierta. La tarea de cola se renueva como máximo una vez por minuto y marca un problema si no se procesa en 20 segundos. Las colas síncronas se muestran como tales, sin afirmar que exista un worker. `/up` permanece como comprobación independiente para un monitor externo.

## Respaldos y recuperación

El programador ejecuta `backup:run` a las 02:00, `backup:clean` a las 03:00 y `backup:monitor` a las 04:00, en la zona horaria del servidor. `composer dev` inicia `schedule:work` durante el desarrollo; en producción configura la ejecución de `schedule:run` cada minuto en un solo nodo. La página **Salud del sistema** muestra el disco y la fecha del último respaldo; los problemas generan una notificación y un correo para los super-admins activos. Configura `BACKUP_ALERT_EMAIL` como destino de emergencia si la base de datos no permite consultar las cuentas.

El archivo ZIP incluye el volcado de la base de datos configurada y `storage/app/private` y `storage/app/public`. Se guarda en el disco privado `backups` de forma predeterminada. El super-admin puede configurar una contraseña independiente desde la pestaña **Respaldos** o con `php artisan backup:password`; se guarda cifrada en los ajustes. `BACKUP_ARCHIVE_PASSWORD` y después `APP_KEY` son los valores iniciales cuando no se ha configurado una clave desde la aplicación. Para un destino remoto privado configura `BACKUP_DISK=backup_s3` y las variables `AWS_*`; los objetos quedan bajo `BACKUP_S3_PREFIX`. Prepara una recuperación aislada con `php artisan backup:restore --target="RUTA_ABSOLUTA_NUEVA"`. El respaldo no contiene `.env`; conserva aparte las credenciales y claves necesarias para recuperar la aplicación. La guía completa está en [docs/backups.md](docs/backups.md).

El super-admin también puede pausar la programación y preparar restauraciones desde la pestaña **Respaldos** de Configuración general. Las restauraciones web se procesan en la cola `backup_restores`; en producción necesita un worker dedicado (consulta la guía). Cada día a las 05:00, `backup:verify` comprueba si hubo un simulacro exitoso en los últimos siete días. Cuando corresponde, restaura el ZIP más reciente en una carpeta aislada, verifica el volcado SQLite si aplica, elimina esa copia temporal y registra el resultado. Los fallos generan avisos al super-admin.
