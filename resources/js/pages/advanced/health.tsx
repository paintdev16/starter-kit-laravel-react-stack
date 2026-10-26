import { Head, router } from '@inertiajs/react';
import { useConnectionStatus } from '@laravel/echo-react';
import {
    Activity,
    CheckCircle2,
    Clock3,
    Database,
    HardDrive,
    HeartPulse,
    Radio,
    RefreshCw,
    ServerCog,
    TriangleAlert,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index as healthIndex } from '@/routes/advanced/health';

type Status = 'healthy' | 'unhealthy' | 'pending' | 'unknown' | 'informational' | 'inactive';
type Check = { status: Status; message: string };
type Health = {
    checked_at: string;
    database: Check;
    cache: Check;
    storage: Check & { driver: string };
    queue: Check & { driver: string; last_processed_at?: string };
    backup: Check & { disk: string; location: string; last_backup_at?: string };
    reverb: { enabled: boolean; configured: boolean };
};

const statusLabel: Record<Status, string> = {
    healthy: 'Operativo',
    unhealthy: 'Requiere atención',
    pending: 'Comprobando',
    unknown: 'Sin comprobar',
    informational: 'Sin worker',
    inactive: 'Desactivado',
};

const statusStyles: Record<Status, string> = {
    healthy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    unhealthy: 'bg-destructive/10 text-destructive',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    unknown: 'bg-muted text-muted-foreground',
    informational: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    inactive: 'bg-muted text-muted-foreground',
};

function dateTime(value: string) {
    return new Date(value).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    });
}

function HealthCard({
    title,
    icon: Icon,
    check,
    detail,
}: {
    title: string;
    icon: LucideIcon;
    check: Check;
    detail?: string;
}) {
    return (
        <article className="flex min-h-48 flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                </span>
                <span
                    className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        statusStyles[check.status],
                    )}
                >
                    {statusLabel[check.status]}
                </span>
            </div>
            <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                    {check.message}
                </p>
            </div>
            {detail && (
                <p className="mt-auto border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    {detail}
                </p>
            )}
        </article>
    );
}

export default function SystemHealth({ health }: { health: Health }) {
    const connection = useConnectionStatus();
    const [refreshing, setRefreshing] = useState(false);
    const refresh = () => {
        if (refreshing) return;
        setRefreshing(true);
        router.reload({
            only: ['health'],
            onFinish: () => setRefreshing(false),
        });
    };

    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({ only: ['health'] });
        }, 10000);

        return () => window.clearInterval(timer);
    }, []);

    const reverb: Check = !health.reverb.enabled
        ? {
              status: 'inactive',
              message: 'La integración está desactivada desde Configuración general.',
          }
        : !health.reverb.configured
          ? {
                status: 'unhealthy',
                message: 'Faltan datos de configuración para conectar con Reverb.',
            }
          : connection === 'connected'
            ? {
                  status: 'healthy',
                  message: 'Este navegador está conectado al servidor en tiempo real.',
              }
            : connection === 'connecting' || connection === 'reconnecting'
              ? {
                    status: 'pending',
                    message: 'Este navegador intenta conectar con Reverb.',
                }
              : {
                    status: 'unhealthy',
                    message: 'Este navegador no está conectado a Reverb.',
                };

    const checks = [health.database, health.cache, health.storage, health.queue, health.backup, reverb];
    const operative = checks.filter((check) => check.status === 'healthy').length;
    const attention = checks.filter((check) => check.status === 'unhealthy').length;

    return (
        <>
            <Head title="Salud del sistema" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-10 md:gap-8 md:p-8">
                <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-primary/18 via-card to-card p-6 shadow-lg shadow-primary/5 sm:p-8 lg:p-10">
                    <div className="pointer-events-none absolute -top-20 -right-12 size-72 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                                <HeartPulse className="size-4" aria-hidden="true" />
                                Operación
                            </span>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Salud del sistema
                                </h1>
                                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                                    Comprueba los servicios que utiliza la aplicación y detecta si la cola procesa tareas.
                                </p>
                            </div>
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock3 className="size-4" aria-hidden="true" />
                                Última comprobación: {dateTime(health.checked_at)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={refreshing}
                            onClick={refresh}
                            className="self-start bg-background/80 lg:self-end"
                        >
                            <RefreshCw
                                className={cn('size-4', refreshing && 'animate-spin')}
                                aria-hidden="true"
                            />
                            Actualizar
                        </Button>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <div><p className="text-2xl font-bold">{operative}</p><p className="text-sm text-muted-foreground">Servicios operativos</p></div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5">
                        <TriangleAlert className={cn('size-8', attention ? 'text-destructive' : 'text-muted-foreground')} aria-hidden="true" />
                        <div><p className="text-2xl font-bold">{attention}</p><p className="text-sm text-muted-foreground">Requieren atención</p></div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <HealthCard title="Base de datos" icon={Database} check={health.database} />
                    <HealthCard title="Caché" icon={Activity} check={health.cache} />
                    <HealthCard title="Almacenamiento" icon={HardDrive} check={health.storage} detail={`Disco: ${health.storage.driver}`} />
                    <HealthCard
                        title="Cola de tareas"
                        icon={Workflow}
                        check={health.queue}
                        detail={`Conexión: ${health.queue.driver}${health.queue.last_processed_at ? ` · Última tarea: ${dateTime(health.queue.last_processed_at)}` : ''}`}
                    />
                    <HealthCard title="Laravel Reverb" icon={Radio} check={reverb} detail="Conexión verificada desde este navegador" />
                    <HealthCard
                        title="Respaldos"
                        icon={HardDrive}
                        check={health.backup}
                        detail={`Disco: ${health.backup.disk} (${health.backup.location})${health.backup.last_backup_at ? ` · Último respaldo: ${dateTime(health.backup.last_backup_at)}` : ''}`}
                    />
                    <HealthCard
                        title="Ruta de salud"
                        icon={ServerCog}
                        check={{ status: 'informational', message: 'Laravel expone /up para supervisión externa del arranque de la aplicación.' }}
                        detail="Esta tarjeta no sustituye una sonda externa."
                    />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                    La prueba de cola se envía al cargar esta vista y se renueva como máximo una vez por minuto. Los resultados se actualizan cada 10 segundos mientras la vista está abierta.
                </p>
            </div>
        </>
    );
}

SystemHealth.layout = {
    breadcrumbs: [{ title: 'Salud del sistema', href: healthIndex() }],
};
