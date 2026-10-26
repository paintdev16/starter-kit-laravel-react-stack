# Respaldos y recuperación

## Configuración

Se utiliza `spatie/laravel-backup` 10.3. El archivo `config/backup.php` respalda el contenido de la conexión `DB_CONNECTION` y los archivos de `storage/app/private` y `storage/app/public`. No incluye `.env`, `vendor`, `node_modules`, cachés ni código fuente: el código debe conservarse en el repositorio y las credenciales en un gestor de secretos.

El disco `backups` apunta a `storage/app/backups`, fuera del directorio público. Sirve para empezar en un solo servidor, pero **no protege ante la pérdida de ese servidor**. Para usar el bucket S3 compatible configura `BACKUP_DISK=backup_s3`; ese disco usa las variables `AWS_*`, almacena los archivos bajo el prefijo privado `BACKUP_S3_PREFIX` (por defecto `backups`) y activa errores de escritura. Mantén `BACKUP_NAME` estable para que la limpieza y el monitoreo encuentren los archivos antiguos.

El ZIP usa cifrado AES. El super-admin puede configurar una contraseña independiente de al menos 16 caracteres en la pestaña «Respaldos», tras confirmar la contraseña actual de su cuenta, o con `php artisan backup:password`. Ambos métodos guardan la clave cifrada en la tabla de ajustes y la aplican a los próximos respaldos; nunca se devuelve al navegador. `BACKUP_ARCHIVE_PASSWORD` en `.env` o en el gestor de secretos sirve como valor inicial si todavía no se configuró una clave desde la aplicación. Si tampoco existe, se utiliza `APP_KEY`, como en los respaldos anteriores. **Cada ZIP conserva la contraseña con la que se creó**: cambiarla no modifica archivos existentes. Guarda todas las contraseñas históricas fuera del servidor. Para recuperar un ZIP aunque la base de datos se haya perdido, introduce la contraseña al restaurarlo; no dependas solo del valor cifrado guardado en esa misma base. Conserva también `APP_KEY` y los demás secretos necesarios para descifrar datos de Laravel.

Configura `BACKUP_ALERT_EMAIL` con una dirección operativa externa. Cuando la base de datos funciona, el error se guarda como notificación y se envía por correo a cada super-admin activo. Si la base de datos falla, ese correo de emergencia es el único destino disponible. Confirma que el transporte `MAIL_*` entrega mensajes fuera del servidor; el transportador `log` no envía correos reales.

El volcado de SQLite requiere `sqlite3` en el `PATH` del proceso PHP. MySQL y PostgreSQL requieren respectivamente `mysqldump` y `pg_dump` compatibles con el servidor. El respaldo falla y genera un aviso si falta el binario correspondiente.

## Operación

Las tareas están en `routes/console.php`:

| Hora | Comando | Función |
| --- | --- | --- |
| 02:00 | `backup:run` | Crear el ZIP |
| 03:00 | `backup:clean` | Aplicar la retención |
| 04:00 | `backup:monitor` | Detectar respaldos ausentes o antiguos |
| 05:00 | `backup:verify` | Simular la recuperación del ZIP más reciente si han pasado siete días desde la última verificación exitosa |

`composer dev` inicia `schedule:work` en desarrollo. En producción, Laravel debe ejecutar `php artisan schedule:run` cada minuto. En un despliegue con varios servidores, ejecuta el programador en **un solo nodo** o configura un bloqueo distribuido antes de habilitarlo en varios. La política conserva todos los respaldos siete días, después muestras diarias durante 16 días, semanales durante ocho semanas, mensuales durante cuatro meses y anuales durante dos años. El límite de almacenamiento configurado es 5000 MB; la estrategia nunca borra el respaldo más reciente.

El super-admin puede activar o desactivar los **respaldos automáticos** en la pestaña «Respaldos» de `/admin/settings`. El cambio detiene o reanuda `backup:run`, `backup:clean`, `backup:monitor` y `backup:verify` programados; no borra ZIP existentes ni impide ejecutar comandos manuales. En esa pestaña también puede seleccionar un ZIP y preparar una restauración aislada. Si el ZIP tiene una contraseña anterior, puede introducirla allí; la tarea se cifra en la cola y esa contraseña no se almacena en el historial de restauraciones.

`backup:verify` también respeta ese interruptor. Corre cada día a las 05:00, pero solo envía un simulacro a la cola si no hubo uno exitoso en los últimos siete días. Selecciona el ZIP más reciente, lo restaura en `storage/app/restore-staging`, verifica la integridad del volcado SQLite y elimina la copia temporal; conserva el estado y la fecha en el historial de la pestaña «Respaldos». Si falta el ZIP, no funciona la cola o la recuperación falla, avisa a los super-admins activos por notificación y correo; usa `BACKUP_ALERT_EMAIL` como respaldo cuando no logra notificar a esas cuentas. Las tareas pendientes durante más de cuatro horas se marcan como fallidas al ejecutar de nuevo `backup:verify`. MySQL y PostgreSQL requieren un ensayo adicional de importación en una base aislada: el restaurador actual solo valida completamente la importación de SQLite.

Este control depende del programador y del worker `backup_restores`. Si toda la aplicación deja de ejecutar tareas, no podrá alertar por sí misma; configura un monitor externo del programador y del endpoint `/up`.

La restauración web requiere un worker de la conexión `backup_restores`. `composer dev` lo inicia en desarrollo. En producción ejecuta `php artisan queue:work backup_restores --queue=backup-restores --timeout=3600 --tries=1` como proceso supervisado. La conexión tiene `retry_after=3900` segundos. El resultado se guarda bajo `storage/app/restore-staging/{id}` y se consulta en la misma pestaña. No reemplaza la instalación activa: sigue los pasos de recuperación aislada antes de cambiar tráfico.

Para crear un respaldo bajo supervisión, ejecutar `php artisan backup:run`. `php artisan backup:list` muestra los ZIP disponibles y `php artisan backup:monitor` comprueba su antigüedad. La página `/admin/health` muestra la fecha del respaldo más reciente. El paquete comprueba que el ZIP se pueda abrir y que tenga el número esperado de entradas; esto **no equivale** a una restauración de prueba.

## Restaurar sin tocar la instalación activa

`php artisan backup:list` muestra los ZIP. El comando siguiente toma el más reciente del disco configurado (`BACKUP_DISK`) y prepara una copia aislada. La carpeta principal debe existir y la carpeta de destino todavía no debe existir:

```powershell
php artisan backup:restore --target="D:\recuperacion\prueba-2026-10-24"
```

Para elegir otro ZIP, pasa solo su nombre: `php artisan backup:restore 2026-10-23-02-00-00.zip --target="D:\recuperacion\prueba-anterior"`. Usa `--ask-password` para un ZIP creado con la antigua `APP_KEY` u otra contraseña; la clave se solicita sin mostrarla y no queda en el historial del terminal. El comando descarga el archivo del disco privado, rechaza rutas peligrosas y entradas repetidas, y descifra y verifica sus contenidos en la carpeta nueva. Si falla, deja la carpeta parcial identificada para revisarla o eliminarla. Para SQLite importa el volcado en `database/restored.sqlite` y exige que `PRAGMA integrity_check` responda `ok`. Para MySQL y PostgreSQL deja el volcado en `db-dumps/` para importarlo mediante sus clientes. La aplicación activa nunca se modifica.

1. Conserva intactos el ZIP original y la base de producción. Ejecuta `backup:restore` hacia una carpeta nueva en el entorno de recuperación.
2. Prepara una instalación del **mismo commit** de la aplicación y copia sus secretos desde el gestor seguro. No uses el `.env` de otra aplicación; `APP_KEY` debe corresponder a los datos que vas a recuperar.
3. Para SQLite, apunta `DB_DATABASE` de la instalación aislada a `database/restored.sqlite`. Para MySQL o PostgreSQL importa el archivo de `db-dumps/` en una **base nueva y vacía** con los clientes del motor. No importes sobre la base activa.
4. Copia `storage/app/private` y `storage/app/public` a la instalación aislada. Reconstruye el enlace público con `php artisan storage:link` si utilizas el disco público.
5. Comprueba `php artisan migrate:status`, el acceso de un super-admin, los avatares, las notificaciones y los tokens necesarios. No ejecutes `migrate:refresh` sobre los datos recuperados.
6. Solo después de verificar la copia decide el cambio de tráfico y conserva el estado anterior durante una ventana de reversión. Registra la fecha y el resultado del simulacro.

El ZIP puede almacenarse en otro disco o proveedor. Descárgalo a la máquina de recuperación antes de extraerlo; no habilites una ruta pública de descarga ni una restauración web automática.
